const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
const fixture=()=>{
 CQ.d.fut={em:new Date().toISOString(),itens:[{c:'WIN',s:'BMFBOVESPA:WIN1!',n:'Mini índice',px:173570,d1:.15,dp:0},{c:'WDO',s:'BMFBOVESPA:WDO1!',n:'Mini dólar',px:5601,d1:-.04,dp:1}]};CQ.ts.fut=Date.now();CQ.aba='fut';tab='mercado';MKT.tab='cq';render();
};
async function open(browser,base){const p=await browser.newPage({viewport:{width:390,height:844}});await p.route('https://**',r=>r.abort());await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});return p}
test('Mercado: lista pronta, busca preservada, quatro abas e layouts de 320 a 1440px',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.evaluate(fixture);
 const app=p.locator('#app:not(.v503-fantasma)');
 await expect(app.locator('.market-quotes .cqr')).toHaveCount(2);
 await expect(app.locator('nav.m403-primary-tabs button:visible')).toHaveText(['Cotações','Notícias','Agenda','Análises','Long & Short']);
 await expect(app.locator('#m550-destaque,.m408-workspace,.m405-dashboard,.m408-empty,.cq388-searchbar')).toHaveCount(0);
 await p.locator('[data-market-search]').fill('WIN');await expect(app.locator('.cqr')).toHaveCount(1);
 await p.evaluate(()=>{CQ.d.fut.itens[0].px=173600;cqPinta()});
 await expect(p.locator('[data-market-search]')).toHaveValue('WIN');await expect(p.locator('[data-market-search]')).toBeFocused();await expect(app.locator('.cqp')).toContainText('173.600');
 await p.locator('[data-market-search]').fill('');
 for(const width of [320,390,768,1440]){
  await p.setViewportSize({width,height:900});
  await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width>=1024){await expect(app.locator('.m623-term')).toBeVisible();await expect(app.locator('.m623-term .m623-col')).toHaveCount(3);await app.locator('[data-m623-modo="lista"]').click();}
  else await expect(app.locator('.m623-term,.m623-sw')).toHaveCount(0);
  assert.ok(await app.locator('.cqr').first().evaluate(el=>el.getBoundingClientRect().top<500));
  assert.ok(await p.locator('[data-market-search]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
  assert.ok(await p.locator('[data-cqr]').evaluate(el=>el.getBoundingClientRect().height>=40));
  await p.screenshot({path:'test-results/mercado-v585-'+width+'.png'});
 }
 await p.setViewportSize({width:390,height:844});await app.getByRole('button',{name:'Análises',exact:true}).click();
 await expect.poll(()=>p.evaluate(()=>MKT.tab)).toBe('lab');
 await expect(app.locator('.sw9tabs>button')).toHaveCount(4);
 for(const box of await app.locator('.sw9tabs>button').all())assert.ok(await box.evaluate(el=>el.getBoundingClientRect().right<=innerWidth));
 await p.screenshot({path:'test-results/mercado-v585-analises.png'});
 assert.deepEqual(errors,[]);
}));
test('Profit: fechamento único, contrato vigente, timestamps inválidos e isolamento entre contas',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);await p.clock.setFixedTime(new Date('2026-11-13T00:00:00Z'));await p.evaluate(fixture);
 const result=await p.evaluate(async()=>{
  SESS={uid:'owner-a',at:'fixture'};CQ.pfTs=0;const current=codFut('WIN');
  rq=async()=>new Response(JSON.stringify([{ticker:'WINFUT',ult:173570,var:.15,updated_at:'2026-11-12T21:30:00Z'},{ticker:current,ult:173600,var:.2,updated_at:'2026-11-12T21:30:00Z'},{ticker:'WINZ20',ult:99000,var:9,updated_at:'2026-11-12T23:59:30Z'},{ticker:'WDOFUT',ult:5601,var:-.04,updated_at:'bad-date'}]));
  await cqPonte();cqPinta();const quote=cqPf(CQ.d.fut.itens[0],'fut');return {quote,live:Object.keys(CQ.pf),saved:CQ.saved['@WIN'],wdo:CQ.saved['@WDO']};
 });
 assert.equal(result.quote.px,173600);assert.equal(result.quote.fechado,true);assert.equal(result.quote.live,false);assert.equal(result.wdo,undefined);assert.ok(!result.live.includes('@WIN'));
 await expect(p.locator('.market-quotes')).toContainText('FECHADO');await expect(p.locator('.market-quotes')).not.toContainText('Profit ao vivo');await expect(p.locator('.cqr').first()).toContainText('173.600');
 await p.evaluate(async()=>{SESS={uid:'owner-b',at:'fixture'};rq=async()=>new Response('[]');await cqPonte();cqPinta()});
 assert.deepEqual(await p.evaluate(()=>CQ.saved),{});
 await expect(p.locator('.cql')).not.toContainText('FECHADO');
}));
test('consultas simultâneas: categoria em carga não exibe vazio e respostas fora de ordem não trocam a lista',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);await p.evaluate(fixture);
 await p.evaluate(()=>{
  CQ.d.idx=undefined;CQ.d.br=undefined;CQ.errors={};CQ.loading={};CQ.busy='';
  window.SUPA_URL='https://fixture.test';window.SUPA_KEY='fixture';
  window.marketPending={};fetch=async(url,options)=>{const body=JSON.parse(options.body);return new Promise(resolve=>{marketPending[body.aba]=items=>resolve(new Response(JSON.stringify({itens:items,em:new Date().toISOString()})))})};
  CQ.aba='idx';cqPinta();window.marketIdxJob=cqCarrega('idx',true);
  CQ.aba='br';cqPinta();window.marketBrJob=cqCarrega('br',true);
 });
 await expect(p.locator('.market-state')).toContainText('Consultando');await expect(p.locator('.m408-empty')).toHaveCount(0);
 await p.evaluate(async()=>{marketPending.br([{s:'BMFBOVESPA:PETR4',c:'PETR4',n:'Petrobras',px:44,d1:1,dp:2}]);await marketBrJob});
 await expect(p.locator('.cqr')).toContainText('PETR4');
 await p.evaluate(async()=>{marketPending.idx([{s:'BMFBOVESPA:IBOV',c:'IBOV',n:'Ibovespa',px:170000,d1:1,dp:0}]);await marketIdxJob});
 await expect(p.locator('.cqr')).toContainText('PETR4');await expect(p.locator('.cqr')).not.toContainText('IBOV');
 await p.evaluate(()=>{CQ.aba='idx';cqPinta()});await expect(p.locator('.cqr')).toContainText('IBOV');
}));
