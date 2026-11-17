const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
async function open(browser,base){
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('https://api.bcb.gov.br/**',route=>route.fulfill({
  status:200,contentType:'application/json',
  headers:{'Access-Control-Allow-Origin':'*'},
  body:JSON.stringify([{data:'12/11/2026',valor:'13.65'}])
 }));
 await p.route('https://**',route=>route.abort());
 await p.goto(base+'/?demo=1');
 await p.locator('#splash').waitFor({state:'hidden'});
 return p;
}
test('v697: Plano de transição mantém seus cinco critérios, subabas e divisão 50/30/20',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>{FIN.t='plano';DiarioRotas.navigate('carreira');});
 await expect(page.locator('#app #trx697')).toHaveCount(1);
 await expect(page.locator('#trx697 .trx-value')).toHaveCount(6);
 await expect(page.locator('#trx697 .trx-milestone')).toHaveCount(5);
 await expect(page.locator('#app')).toContainText('5 critérios');
 await expect(page.locator('#app')).toContainText('Reinvestir');
 await expect(page.locator('#app')).toContainText('Reserva');
 await expect(page.locator('#app')).toContainText('Seu trading × CDI × Ibovespa');
 await page.evaluate(()=>render());
 await expect(page.locator('#app #trx697')).toHaveCount(1);
 await page.locator('#app [data-fin-t="res"]').click();
 await expect.poll(()=>page.evaluate(()=>FIN.t)).toBe('res');
 await expect(page.locator('#trx697')).toHaveCount(0);
 await expect(page.locator('#app')).toContainText('Reserva de emergência');
 await page.evaluate(()=>DiarioRotas.navigate('estudos'));
 await expect(page.locator('#trx697')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 await page.close();
}));
test('v697: engenharia reversa e inflação usam valores auditáveis sem duplicar saúde',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base);
 const result=await page.evaluate(()=>{
  const p=PlanoTransicao697;
  const target=p.capitalTarget({salary:6000,cost:4000,renda:7000,health:500,benefits:300,
   extra13:true,extraVacation:true,monthlyRate:7,ipca:4,months:60});
  const none=p.runProjection({reserve:10000,bank:25000,months:60,annualCDI:0,
   monthlyReinvest:0,monthlyReserve:0,monthlyCLT:0,goalReserve:54000,goalBank:120000});
  const base={reserve:10000,bank:25000,months:60,annualCDI:13.65,
   monthlyReinvest:210,monthlyReserve:140,monthlyCLT:1000,
   goalReserve:54000,goalBank:120000};
  const extra=p.requiredExtra(base),withExtra=p.runProjection(base,extra);
  return {target,none,extra,withExtra,baseRun:p.runProjection(base),years:p.targetMonths({prazo:'72',months:40})};
 });
 assert.ok(Math.abs(result.target.living-4500)<1e-6);
 assert.ok(Math.abs(result.target.income-(7000+500+300+6000/12+6000/36))<1e-6);
 assert.equal(result.target.reserve,54000);
 assert.ok(Math.abs(result.target.capital-result.target.income/.07)<.01);
 assert.ok(Math.abs(result.target.inflation-1.04**5)<1e-9);
 assert.equal(result.none.total,35000);
 assert.ok(result.extra>=0);
 assert.equal(result.withExtra.achieved,true);
 assert.equal(result.years,72);
 await page.close();
}));
test('v697: saldo automático não soma reserva em dobro, aceita modo manual e salva prazo e protocolo',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base);
 const res=await page.evaluate(()=>{
  const p=PlanoTransicao697;
  S.fin=S.fin||{};S.fin.res=[{v:5000},{v:-1000}];
  const before=window.pfCalc;
  window.pfCalc=()=>({pos:[{tk:'SELIC 2029',cl:'tesouro',v:2000}]});
  const source=p.reserveSource();
  window.pfCalc=before;
  return source;
 });
 assert.equal(res.value,4000);
 assert.equal(res.separate,2000);
 await page.evaluate(()=>{tab='carreira';FIN.t='plano';render();});
 await page.evaluate(()=>{
  const root=document.querySelector('#trx697');
  const select=root.querySelector('[data-trx="prazo"]');
  select.value='72';select.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await expect(page.locator('#trx697 .trx-milestone')).toHaveCount(6);
 await page.evaluate(()=>{
  const root=document.querySelector('#trx697');
  const toggle=root.querySelector('[data-trx="manual"]');
  toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await expect(page.locator('[data-trx="reserveManual"]')).toBeVisible();
 await page.evaluate(()=>{
  let input=document.querySelector('[data-trx="reserveManual"]');
  input.value='6000';input.dispatchEvent(new Event('change',{bubbles:true}));
  input=document.querySelector('[data-trx="protocol"]');
  input.value='Parar saques após duas perdas mensais.';
  input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 const saved=await page.evaluate(()=>({
  cfg:S.ax.carreiraEngenharia,display:document.querySelector('#trx697')?.innerText||''
 }));
 assert.equal(saved.cfg.prazo,'72');
 assert.equal(saved.cfg.reserveManual,6000);
 assert.equal(saved.cfg.protocol,'Parar saques após duas perdas mensais.');
 assert.ok(saved.display.includes('6.000,00'));
 await page.close();
}));
test('v697: quadro de comparação usa crMeses líquido em vez de eqDias bruto',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base);
 const got=await page.evaluate(()=>{
  tab='carreira';FIN.t='plano';render();
  const mes=crMeses(crCfg()).filter(x=>x.k.startsWith(loc().slice(0,4)));
  const net=mes.reduce((a,x)=>a+(+x.liq||0),0);
  const html=PlanoTransicao697.benchmark();
  const formatted=Number.isFinite(net)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(net):'';
  return {net,html,formatted};
 });
 assert.match(got.html,/Trading líquido/);
 assert.ok(got.html.includes(got.formatted));
 assert.ok(!got.html.includes('WIN como substituto</b>'));
 await page.close();
}));
