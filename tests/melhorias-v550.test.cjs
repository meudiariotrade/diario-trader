const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v550: destaque WIN/WDO, análises recolhidas, guia de 3 passos, continuar estudo e revisão de regras',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // Horário fixo durante o pregão: o teste não pode depender do relógio de quem roda (as travas de pós-17h mudam a tela).
 await p.clock.setFixedTime(new Date('2026-11-11T15:00:00Z'));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.evaluate(()=>{CQ.d.fut={em:new Date().toISOString(),itens:[{s:'BMFBOVESPA:WIN1!',c:'WIN1!',n:'Mini Índice',px:128450,d1:0.62,dp:0},{s:'BMFBOVESPA:WDO1!',c:'WDO1!',n:'Mini Dólar',px:5412.5,d1:-0.18,dp:1}]};tab='mercado';MKT.tab='cq';CQ.aba='fut';render()});
 await expect(app.locator('#cotbox .cqr')).toHaveCount(2);
 await expect(app.locator('#cotbox .cql')).toContainText('128.450');
 await expect(app.locator('#cotbox .cqr').filter({hasText:'WDO'})).toContainText('WDO');
 await p.evaluate(()=>{MKT.tab='lab';render()});
 await expect(app.locator('.m550-sanf').first()).toHaveClass(/m550-aberto/);
 const fechados=await app.locator('.m550-sanf:not(.m550-aberto)').count();assert.ok(fechados>=3);
 await app.locator('.m550-sanf:not(.m550-aberto) > .sw9t').first().click();
 assert.equal(await app.locator('.m550-sanf:not(.m550-aberto)').count(),fechados-1);
 await p.evaluate(()=>{MKT.tab='nt';render()});
 await app.locator('[data-m550-jornal="jornal"]').click();
 await expect.poll(()=>p.evaluate(()=>MKT.tab)).toBe('jr');
 await p.evaluate(()=>{S.trades=[];S.ax.guia550={};tab='home';render()});
 await expect(app.locator('#m550-guia li')).toHaveCount(3);
 await app.locator('[data-m550-passo="setup"]').click();
 await expect.poll(()=>p.evaluate(()=>tab)).toBe('regras');
 assert.equal(await p.evaluate(()=>S.ax.guia550.setup),1);
 await p.evaluate(()=>{S.rules.push({id:'dup-1',cat:0,t:'Ler o plano antes de operar!',u:1});render()});
 await expect(app.locator('#m550-regras')).toContainText('Ler o plano antes de operar!');
 await app.locator('[data-m550-remover="dup-1"]').click();
 await expect.poll(()=>p.evaluate(()=>S.rules.some(r=>r.id==='dup-1'))).toBe(false);
 await p.evaluate(()=>{tab='home';render()});
 await app.locator('[data-m550-pular]').click();
 await expect(app.locator('#m550-guia')).toHaveCount(0);
 await p.evaluate(()=>{S.ax.estUltimo={tipo:'livro',id:'livro-x',titulo:'Candlestick'};tab='estudos';render()});
 await expect(app.locator('#m550-continuar')).toContainText('Candlestick');
 for(const width of [320,1440]){await p.setViewportSize({width,height:900});await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 assert.deepEqual(errors,[]);
}));
