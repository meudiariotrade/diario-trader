const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
const image={name:'operacao.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64')};
test('Projeto 2027: checklist por setup, troca sem herdar marcações e persistência na operação',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{S.ax.planoOp=1;Projeto2027.ensure()}); // v554: setups do plano modelo
 await p.evaluate(()=>document.querySelector('#fabm [data-a="new"][data-tp="D"]').click());
 await expect(p.getByText(/Antes de registrar trade novo, coloque as fotos/)).toBeVisible();
 await expect(p.locator('#sh [data-setup-pick]').filter({hasText:/padrão clássico \+/})).toHaveCount(0);
 // Abre a ficha nativa de um registro de demonstração, sem alterar a conta real.
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.a='edit';b.dataset.id='demo-trade-1';document.body.append(b);b.click();b.remove()});
 const names=await p.evaluate(()=>Projeto2027.names);
 await expect(p.locator('#sh [data-setup-pick]').filter({hasText:/padrão clássico \+/})).toHaveCount(2);
 await p.getByRole('button',{name:names.indice,exact:true}).click();
 await expect(p.locator('#sh [data-ck]')).toHaveCount(12);
 await expect(p.locator('#sh')).toContainText('AXIA3');await expect(p.locator('#sh')).toContainText('3 a 5 ticks');
 await p.locator('#sh [name="project2027Pattern"]').fill('Rompimento da máxima');
 await p.locator('#sh [data-ck="0"]').check();
 assert.equal(await p.evaluate(()=>S.trades.find(t=>t.id==='demo-trade-1').setup),'Rompimento demonstrativo');
 await p.getByRole('button',{name:names.dolar,exact:true}).click();
 await expect(p.locator('#sh [data-ck]')).toHaveCount(11);
 await expect(p.locator('#sh [data-ck]:checked')).toHaveCount(0);
 await expect(p.locator('#sh')).toContainText('DI31');await expect(p.locator('#sh')).toContainText('0,5 ponto');
 await p.getByRole('button',{name:names.indice,exact:true}).click();
 await p.locator('#sh [name="project2027Pattern"]').fill('Rompimento da máxima');
 await p.locator('#sh [data-ck="0"]').check();await p.locator('#sh [data-ck="6"]').check();
 // O plano nunca sobrescreve preços, quantidade ou confirma cumprimento automático.
 assert.equal(await p.locator('#sh [name="entry"]').inputValue(),'100000');
 for(const key of ['pin','pout']){await p.locator('#sh [data-k="'+key+'"]').setInputFiles(image);await expect(p.locator('#sh [data-k="'+key+'"]').locator('..')).toContainText('Trocar')}
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:1000});assert.ok(await p.getByRole('button',{name:names.indice,exact:true}).evaluate(n=>n.getBoundingClientRect().right<=innerWidth));}
 await p.locator('#sh [data-a="savetrade"]').click();await expect(p.locator('#sh [name="setup"]')).toHaveCount(0);
 const saved=await p.evaluate(()=>S.trades.find(t=>t.id==='demo-trade-1'));
 assert.equal(saved.setup,names.indice);assert.equal(saved.project2027Pattern,'Rompimento da máxima');assert.deepEqual(saved.chk,{'0':true,'6':true});assert.equal(saved.checklist2027.items.length,12);
 await expect.poll(()=>p.evaluate(async()=>{const state=await idb('kv','get','s');return state?.trades?.find(t=>t.id==='demo-trade-1')?.project2027Pattern})).toBe('Rompimento da máxima');
 await p.reload();await p.locator('#splash').waitFor({state:'hidden'});
 const restored=await p.evaluate(()=>S.trades.find(t=>t.id==='demo-trade-1'));assert.deepEqual(restored.chk,saved.chk);assert.deepEqual(restored.checklist2027,saved.checklist2027);
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.a='edit';b.dataset.id='demo-trade-1';document.body.append(b);b.click();b.remove()});
 await expect(p.locator('#sh [data-ck]:checked')).toHaveCount(2);await expect(p.locator('#sh [name="project2027Pattern"]')).toHaveValue('Rompimento da máxima');
 await p.locator('#sh [data-ck="0"]').uncheck();assert.equal(await p.evaluate(()=>S.trades.find(t=>t.id==='demo-trade-1').chk[0]),true);
 await p.locator('#sh [name="setup"]').fill('Meu setup livre');await p.locator('#sh [name="setup"]').press('Tab');await expect(p.locator('#sh [data-ck]')).toHaveCount(0);
 await p.evaluate(name=>{S.ax['chk.setups'][name]=['Minha regra personalizada'];Projeto2027.ensure()},names.dolar);
 assert.deepEqual(await p.evaluate(name=>chkDe(name),names.dolar),['Minha regra personalizada']);
 assert.deepEqual(errors,[]);
}));
