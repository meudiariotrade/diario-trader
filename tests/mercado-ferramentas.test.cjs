const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('Long & Short: rota própria, cálculo e retorno; Movimentos fortes sempre em Cotações',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://**',r=>r.abort());
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{tab='mercado';MKT.tab='cq';render()});
 const app=p.locator('#app:not(.v503-fantasma)');
 await expect(app.locator('#v518-mov')).toBeVisible();
 assert.equal(await app.locator('#v518-mov').evaluate(el=>el.previousElementSibling.id),'cotbox');
 await app.locator('#v518-mov>summary').click();await expect(app.locator('#v518-mov')).toContainText('Entre na sua conta');
 await app.getByRole('button',{name:'Long & Short',exact:true}).click();
 await expect.poll(()=>p.evaluate(()=>MKT.tab)).toBe('ls');
 await expect(app.locator('#v512-ls')).toBeVisible();await expect(app.locator('#cotbox')).not.toBeVisible();
 await expect(app.locator('[data-navroute="mercado:ls"]')).toHaveAttribute('aria-current','page');
 await p.locator('#v512-b').fill('ITUB4');await p.locator('[data-v512ls="calc"]').click();
 await expect(app.locator('#v512-ls')).toContainText('Escolha dois ativos diferentes');
 await p.locator('#v512-b').fill('BBDC4');
 await p.evaluate(()=>{window.V512_CANDLES=async ticker=>Array.from({length:400},(_,i)=>[Date.UTC(2025,0,1+i)/1000,0,0,0,ticker==='ITUB4'?30+i*.01+Math.sin(i/5):20+i*.006+Math.cos(i/9)*.3])});
 await p.locator('[data-v512ls="calc"]').click();await expect(app.locator('#v512-ls')).toContainText('Desvio atual');
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:'test-results/mercado-v586-ls-'+width+'.png'})}
 await app.getByRole('button',{name:'Cotações',exact:true}).click();await expect(app.locator('#v518-mov')).toBeVisible();await expect(app.locator('#v512-ls')).toHaveCount(0);
 await p.evaluate(()=>{SESS={uid:'fixture',at:'fixture'};tok=async()=>{};const previous=fetch;fetch=async(url,opts)=>String(url).includes('/rest/v1/movimentos?')?new Response(JSON.stringify([{ativo:'PETR4',variacao:3.4,motivo:'Movimento de teste',criado:new Date().toISOString(),manchetes:[]}])):previous(url,opts)});
 await p.evaluate(()=>DIARIO_V518.cartao(true));await app.locator('#v518-mov>summary').click();await expect(app.locator('#v518-mov')).toContainText('PETR4');await expect(app.locator('#v518-mov')).toContainText('3,4%');
 await app.getByRole('button',{name:'Notícias',exact:true}).click();await expect(app.locator('#v518-mov')).toHaveCount(0);
 assert.deepEqual(errors,[]);
}));
