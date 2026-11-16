const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
async function pageFor(browser,base){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://**',route=>route.abort());
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 return page;
}
test('v694: Carteira existente mantém abas, ativos e painel recolhível sem criar nova rota',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await pageFor(browser,base);
 await page.evaluate(()=>{tab='carteiras';render();});
 await expect(page.locator('#app .pf')).toHaveCount(1);
 await expect(page.locator('#app .pftabs')).toHaveCount(1);
 await expect(page.locator('#app #rebalanceamento-carteira-v694')).toHaveCount(1);
 await expect(page.locator('#rebalanceamento-carteira-v694 .rb694-body')).toHaveCount(0);
 await page.evaluate(()=>document.querySelector('#rebalanceamento-carteira-v694 summary')?.click());
 await expect(page.locator('#rebalanceamento-carteira-v694')).toHaveAttribute('open','');
 await expect(page.locator('#rebalanceamento-carteira-v694 .rb694-section')).toHaveCount(4);
 await page.evaluate(()=>render());
 await expect(page.locator('#app .pftabs')).toHaveCount(1);
 await expect(page.locator('#rebalanceamento-carteira-v694 .rb694-section')).toHaveCount(4);
 await page.evaluate(()=>{tab='estudos';render();});
 await expect(page.locator('#rebalanceamento-carteira-v694')).toHaveCount(0);
 await page.close();
}));
test('v694: cálculo do aporte sem vendas, DY/YoC, alertas e juros reais são auditáveis',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await pageFor(browser,base);
 const got=await page.evaluate(()=>{
  const api=window.CarteiraGestao694;
  const positions=[
   {tk:'ITUB4',mk:'BR',cl:'acao',q:100,v:6000,custo:5000,setor:'Financeiro'},
   {tk:'HGLG11',mk:'BR',cl:'fii',q:20,v:2000,custo:1500,setor:'Fundos imobiliários'},
   {tk:'IVVB11',mk:'BR',cl:'etf',q:10,v:1000,custo:900,setor:'ETFs'},
   {tk:'BTC',mk:'BR',cl:'cripto',q:1,v:1000,custo:800,setor:'Cripto'}
  ];
  S.cart=S.cart||{};S.cart.meta={
   ITUB4:{fs:{dy:6}},HGLG11:{fs:{dy:10}}
  };
  const snapshot={pos:positions,v:10000,fx:5.2};
  const gs=api.groups(snapshot,'class');
  const target={br:30,fii:20,rf:10,ext:20,crypto:20,other:0};
  const reb=api.allocation(gs,target,10000,2000);
  const y=api.yieldMetrics(snapshot),c=api.concentration(snapshot);
  const p0=api.compound(10000,0,0,10),p5=api.compound(10000,500,5,10);
  return {classes:gs.map(g=>[g.key,g.v]),allocation:reb.rows.map(x=>({name:x.key,buy:x.buy})),
   totalBuys:reb.rows.reduce((a,x)=>a+x.buy,0),negative:reb.rows.some(x=>x.buy<0),
   dy:y.dy,yoc:y.yoc,annual:y.annual,monthly:y.monthly,coverage:y.coverage,
   concentration:{topAssets:c.topAssets.map(x=>x.tk),topSectors:c.topSectors.map(x=>x[0]),foreign:c.foreign,foreignPct:c.foreignPct},
   zero:p0.end,project:p5.end,withdrawal:p5.withdrawal,contrib:p5.paid};
 });
 assert.equal(got.totalBuys,2000);
 assert.equal(got.negative,false);
 assert.deepEqual(got.classes.map(x=>x[0]),['br','fii','rf','ext','crypto','other']);
 assert.equal(got.annual,560);
 assert.ok(Math.abs(got.monthly-560/12)<1e-8);
 assert.equal(got.dy,7);
 assert.ok(Math.abs(got.yoc-560/6500*100)<1e-6);
 assert.equal(got.coverage,80);
 assert.deepEqual(got.concentration.topAssets,['ITUB4']);
 assert.deepEqual(got.concentration.topSectors,['Financeiro']);
 assert.equal(got.concentration.foreignPct,10);
 assert.equal(got.zero,10000);
 assert.ok(got.project>got.contrib);
 assert.ok(Math.abs(got.withdrawal-got.project/300)<.01);
 await page.close();
}));
test('v694: alteração de metas e simuladores persiste somente no localStorage',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await pageFor(browser,base);
 await page.evaluate(()=>{tab='carteiras';render();});
 await page.evaluate(()=>document.querySelector('#rebalanceamento-carteira-v694 summary')?.click());
 await expect(page.locator('#rebalanceamento-carteira-v694 .rb694-body')).toBeVisible();
 await page.evaluate(()=>{
  const e=document.querySelector('[data-rb694-field="contribution"]');
  e.value='2500';e.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await expect(page.locator('[data-rb694-field="contribution"]')).toHaveValue('2500');
 await page.evaluate(()=>{
  const e=document.querySelector('[data-rb694-field="monthly"]');
  e.value='1200';e.dispatchEvent(new Event('change',{bubbles:true}));
 });
 const saved=await page.evaluate(()=>{
  const key=Object.keys(localStorage).find(x=>x.startsWith('diario-gestao-rebalanceamento-v694:'));
  return key&&JSON.parse(localStorage.getItem(key));
 });
 assert.equal(saved.contribution,2500);
 assert.equal(saved.monthly,1200);
 assert.ok(saved.target&&saved.target.class);
 await page.evaluate(()=>{tab='carteiras';render();});
 await expect(page.locator('#rebalanceamento-carteira-v694 .rb694-body')).toBeVisible();
 await expect(page.locator('[data-rb694-field="monthly"]')).toHaveValue('1200');
 await page.close();
}));
