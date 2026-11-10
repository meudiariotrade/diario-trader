const{test}=require('node:test');const assert=require('node:assert/strict');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('Terminal anterior: conteúdo exclusivo por modo, menu em uma linha no PC e no celular',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),app=p.locator('#app:not(.v503-fantasma)');const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.getByRole('button',{name:'Abrir Terminal',exact:true}).click();
 await expect(app.locator('#v421-gp')).toBeVisible();await expect(app.locator('.simple-terminal-intro,.simple-terminal-more')).toHaveCount(0);
 const layouts=await p.evaluate(()=>JSON.stringify(TRM.TS().wss));
 for(const width of [1440,1920,390,320]){
  await p.setViewportSize({width,height:1000});
  await app.locator('[data-tf415-nav="HOME"]').click();
  await expect(app.locator('#v421-gp')).toBeVisible();
  await expect(app.locator('#trgrid')).toBeHidden();await expect(app.locator('.trm>.trbar')).toBeHidden();
  await app.locator('.tf415-nav [data-tf415-nav="WORKSPACES"]').click();
  await expect(app.locator('#trgrid')).toBeVisible();await expect(app.locator('.trm>.trbar')).toBeVisible();
  await expect(app.locator('.tf413-layout')).toBeHidden();
  const menu=await app.locator('.tf415-nav').evaluate(n=>({tops:[...n.querySelectorAll('button')].map(b=>b.getBoundingClientRect().top),gap:parseFloat(getComputedStyle(n).gap),height:n.getBoundingClientRect().height}));
  assert.ok(Math.max(...menu.tops)-Math.min(...menu.tops)<2);assert.ok(menu.gap<=4);assert.ok(menu.height<64);
  const bounds=await app.locator('.trm').evaluate(n=>({x:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,width:innerWidth}));
  assert.ok(bounds.x<=5&&bounds.right>=bounds.width-5,'Terminal deve usar toda a largura, inclusive no PC');
  const bar=await app.locator('.trm>.trbar').evaluate(n=>({height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width,scroll:n.scrollWidth}));
  assert.ok(bar.height<=56,'Barra de comandos deve ficar em uma linha: '+width+' '+JSON.stringify(bar));assert.ok(bar.scroll<=bar.width+1);
  await app.locator('[data-tr341-menu]').click();
  const full=p.getByRole('dialog',{name:'Menu do Terminal',exact:true});await expect(full).toBeVisible();
  await expect(full.getByRole('button',{name:'Qualidade dos dados',exact:true})).toBeVisible();
  await expect(full.getByRole('button',{name:/Organizar|Layouts por horário/}).first()).toBeVisible();
  await full.getByRole('button',{name:'Fechar menu',exact:true}).click();
  await expect(full).toBeHidden();
  await app.locator('.v430-mais').click();
  await expect(p.getByRole('dialog',{name:'Atalhos do Terminal',exact:true})).toBeVisible();
  await expect(p.locator('#v430-atalhos').getByRole('button',{name:'Agenda',exact:true})).toBeVisible();
  await p.locator('#v430-atalhos').getByRole('button',{name:'Fechar',exact:true}).click();
  await p.locator('.v503-fantasma').waitFor({state:'detached'});
  await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await app.locator('[data-tf415-nav="GLOBAL"]').click();
  await expect(app.locator('#trgrid')).toBeHidden();await expect(app.locator('#v421-gp')).toBeVisible();
 }
 assert.equal(await p.evaluate(()=>JSON.stringify(TRM.TS().wss)),layouts);
 // Os cartões não acompanham o usuário para Notícias, Agenda, Análises ou Jornal.
 await p.getByRole('button',{name:'Mercado',exact:true}).last().click();
 for(const page of ['nt','ag','lab','jr']){
  await p.evaluate(()=>{for(const id of ['v518-mov','v519-ins','v520-fa']){const n=document.createElement('details');n.id=id;document.querySelector('#app:not(.v503-fantasma) .dt395-native-mercado').append(n)}});
  await app.locator('.m403-primary-tabs [data-navroute="mercado:'+page+'"]').click();
  await expect(app.locator('#v518-mov,#v519-ins,#v520-fa')).toHaveCount(0);
 }
 assert.deepEqual(errors,[]);
}));
