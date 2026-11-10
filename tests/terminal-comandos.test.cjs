const{test}=require('node:test');const assert=require('node:assert/strict');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('Terminal não oferece nem executa atalhos para telas externas, inclusive Fluxo EWZ e aliases',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:1000}}),app=p.locator('#app:not(.v503-fantasma)'),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.getByRole('button',{name:'Abrir Terminal',exact:true}).click();await expect(app.locator('#terminal-inicio')).toBeVisible();
 const snapshots=await p.evaluate(()=>({layouts:JSON.stringify(TRM.TS().wss),favorite:TRM.TS().favoritos}));
 const removed=await p.evaluate(()=>TerminalCommandPolicy.blocked);
 const catalog=await p.evaluate(()=>DiarioTerminalInicio.catalog().map(i=>i.id));for(const code of removed)assert.ok(!catalog.includes(code),code+' ausente do diretório');
 for(const id of ['@flow','@research','@app','@window','@exit','@query'])assert.ok(!catalog.includes(id),id+' ausente do menu');
 await app.locator('#ti539-search').fill('fluxo');await expect(app.locator('[data-ti539-item="FLUXO"],[data-ti539-item="@flow"]')).toHaveCount(0);
 await app.locator('.tf415-nav [data-tf415-nav="WORKSPACES"]').click();await expect(app.locator('#trgrid')).toBeVisible();
 for(const raw of [...removed,'HOJE','CAL','SAZON','ECOIA']){
  await app.locator('#trcmd').fill(raw);await app.locator('#trcmd').press('Enter');
  assert.equal(await p.evaluate(()=>tab),'term',raw+' não sai do Terminal');assert.equal(await p.locator('dialog[open]').count(),0,raw+' não abre tela sobreposta');
  await p.evaluate(value=>{DiarioTerminalTools.run(value);TRM.roda(value);trRoda(value)},raw);assert.equal(await p.evaluate(()=>tab),'term');
 }
 await p.evaluate(()=>{TerminalResearch.open('fluxo');trTela('FLUXO');trAtivo?.('EWZ')});assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>tab),'term');
 assert.equal(await p.evaluate(()=>JSON.stringify(TRM.TS().wss)),snapshots.layouts);
 await p.evaluate(()=>{TRM.TS().favoritos=['FLUXO','JORNAL','ECO'];TRM.TR.hist=['FLUXO','CAL','PETR4 G']});
 const quick=await p.evaluate(()=>DiarioTerminalTools.catalog(''));for(const row of quick)assert.ok(await p.evaluate(cmd=>TerminalCommandPolicy.allows(cmd),row.cmd));
 await p.keyboard.press('Control+Space');await p.locator('.trquick-search').fill('FLUXO');await expect(p.locator('.trquick-dialog [data-command]')).toHaveCount(0);await p.keyboard.press('Escape');
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.trtela='FLUXO';document.querySelector('#app:not(.v503-fantasma) .trm').append(b);b.click()});assert.equal(await p.evaluate(()=>tab),'term');
 await expect(app.locator('.trm [data-trtela]:visible,.trm [data-terminal-window]:visible,.trm [data-tr="pop"]:visible')).toHaveCount(0);
 await app.locator('#trcmd').fill('ECO');await app.locator('#trcmd').press('Enter');await expect(app.locator('#trgrid')).toBeVisible();assert.equal(await p.evaluate(()=>tab),'term');
 await app.locator('#trcmd').fill('EWZ');await app.locator('#trcmd').press('Enter');assert.equal(await p.evaluate(()=>tab),'term');assert.equal(await p.locator('dialog[open]').count(),0);
 await p.getByRole('button',{name:'Mercado',exact:true}).last().click();await p.evaluate(()=>TerminalResearch.open('fluxo'));await expect(p.locator('dialog[open]')).toHaveCount(1);
 assert.deepEqual(errors,[]);
}));
