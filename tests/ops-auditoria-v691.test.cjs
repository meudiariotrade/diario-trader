const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
async function open(browser,base) {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://**',route=>route.abort());
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 return page;
}
test('v691: Operações mantém hub e abre Auditoria & Monte Carlo sem telas sobrepostas',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.evaluate(()=>{tab='ops';render();});
 console.log('A691 DEBUG',JSON.stringify(await page.evaluate(()=>({tab,hasAudit:!!document.getElementById('ops-audit-691'),hasAPI:!!window.OperacoesAuditoria691,hasMod:!!document.querySelector('#app .modg')}))));
 await expect(page.locator('#app #ops-audit-691')).toHaveCount(1);
 await expect(page.locator('#app .modg')).toBeVisible();
 await expect(page.locator('#ops-audit-691 .a691-panel')).toHaveCount(0);
 await page.evaluate(()=>document.querySelector('#ops-audit-691 summary')?.click());
 await expect(page.locator('#ops-audit-691')).toHaveAttribute('open','');
 await expect(page.locator('#ops-audit-691 .a691-panel')).toBeVisible();
 await expect(page.locator('#ops-audit-691 .a691-head')).toContainText('operações encerradas');
 await page.evaluate(()=>render());
 await expect(page.locator('#ops-audit-691')).toHaveAttribute('open','');
 await expect(page.locator('#ops-audit-691 .a691-panel')).toHaveCount(1);
 await page.evaluate(()=>document.querySelector('#ops-audit-691 summary')?.click());
 await expect(page.locator('#ops-audit-691 .a691-panel')).toHaveCount(0);
 await page.evaluate(()=>{tab='estudos';render();});
 await expect(page.locator('#ops-audit-691')).toHaveCount(0);
 assert.deepEqual(errors,[]);
 await page.close();
}));
test('v691: EV, drawdown, melhor janela, disciplina e Monte Carlo têm valores auditáveis',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base);
 const value=await page.evaluate(()=>{
  const api=OperacoesAuditoria691;
  const make=(pl,date,time,setup,rules='s',error='Nenhum')=>({pl,exitDate:date,entry:{date,minutes:time},setup,rules,error});
  const rows=[
   make(100,'2026-11-09',550,'Rompimento'),
   make(-50,'2026-11-09',580,'Rompimento'),
   make(200,'2026-11-10',590,'Rompimento'),
   make(-100,'2026-11-11',630,'','n','Entrei por dica/emoção (fora do sistema)'),
   make(-50,'2026-11-12',650,'Importado do Profit'),
   make(100,'2026-11-13',620,'Rompimento'),
   make(-20,'2026-11-13',705,''),
   make(100,'2026-11-13',745,'Rompimento')
  ];
  const s=api.summary(rows),g=api.groups(rows),disc=api.disciplineSummary(rows);
  const m=api.monteCarlo({winRate:0,avgWin:100,avgLoss:10,limit:50},500,100,()=>.99);
  return {s:{n:s.n,ev:s.ev,winRate:s.winRate,avgWin:s.avgWin,avgLoss:s.avgLoss,
    payoff:s.payoff,pf:s.pf,maxDD:s.maxDD,maxWin:s.maxWin,maxLoss:s.maxLoss},
    window:g.hour.map(x=>({n:x.stat.n,ev:x.stat.ev})),best:g.best?.name,
    disc:{plan:disc.plan.n,noSetup:disc.noSetup.n,outside:disc.outside.n,difference:disc.difference},
    mc:{risk:m.risk,hit:m.hit,final:m.medianFinal,len:m.median.length,paths:m.count},
    unknown:api.timeslot(1040),week:api.weekday('2026-11-09'),
    source:api.brazilStamp('2026-11-09T09:43')};
 });
 assert.equal(value.s.n,8);
 assert.equal(value.s.ev,35); // total 280 / 8
 assert.equal(value.s.winRate,.5);
 assert.equal(value.s.avgWin,125);
 assert.equal(value.s.avgLoss,55);
 assert.ok(Math.abs(value.s.payoff-125/55)<1e-9);
 assert.ok(Math.abs(value.s.pf-500/220)<1e-9);
 assert.equal(value.s.maxDD,150);
 assert.equal(value.s.maxLoss,2);
 assert.equal(value.window[0].n,3);
 assert.equal(value.window[1].n,3);
 assert.match(value.best,/09h/);
 assert.deepEqual(value.disc.plan,5);
 assert.equal(value.disc.noSetup,2);
 assert.equal(value.disc.outside,1);
 assert.equal(value.mc.paths,500);
 assert.equal(value.mc.hit,500);
 assert.equal(value.mc.risk,1);
 assert.equal(value.mc.len,101);
 assert.equal(value.mc.final,-1000);
 assert.equal(value.unknown,null);
 assert.equal(value.week,0);
 assert.equal(value.source.minutes,583);
 await page.close();
}));
test('v691: painel faz simulação local e mantém as tabelas de Operações intactas',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await open(browser,base);
 await page.evaluate(()=>{
  tab='ops';
  const days=['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-16'];
  S.trades=days.map((day,i)=>({
   id:'audit-'+i,tipo:'D',ativo:'WIN',side:'C',dt:day+'T09:20',dtx:day+'T09:31',
   entry:100000,exit:100000+(i%2? -80:120),qty:1,pt:.2,cost:0,
   setup:i%2?'':'Rompimento',rules:i%2?'n':'s',err:i%2?'Entrei por dica/emoção (fora do sistema)':'Nenhum'
  }));
  render();
 });
 await page.evaluate(()=>document.querySelector('#ops-audit-691 summary')?.click());
 await expect(page.locator('.a691-section')).toHaveCount(4);
 await expect(page.locator('.a691-table')).toHaveCount(2);
 await page.locator('[data-a691-set="winRate"]').fill('45');
 await page.locator('[data-a691-set="avgWin"]').fill('120');
 await page.locator('[data-a691-set="avgLoss"]').fill('80');
 await page.locator('[data-a691-set="limit"]').fill('450');
 await page.locator('[data-a691-run]').click();
 await expect(page.locator('#a691-monte-results')).toContainText('Mediana');
 await expect(page.locator('#a691-monte-results')).toContainText('500 trajetórias');
 await page.locator('[data-a691-filter="period"]').selectOption('all');
 await expect(page.locator('.a691-section')).toHaveCount(4);
 await expect(page.locator('#app .modg')).toBeVisible();
 await page.close();
}));
