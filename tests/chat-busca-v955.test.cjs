const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {withApp}=require('./helpers/app.cjs');
const {expect}=require('playwright/test');
test('v955: chat com histórico flexível e compositor fora da área de rolagem',()=>{
 const src=fs.readFileSync('src/navigation/organizacao-v573.js','utf8');
 assert.match(src,/wf-chat-history\{flex:1 1 0%!important;min-height:0!important;overflow-y:auto!important/);
 assert.match(src,/wf-chat-panel form\{flex:0 0 auto!important/);
 assert.match(src,/max-height:100dvh!important;height:100dvh!important/);
 assert.match(src,/safe-area-inset-bottom/);
});
test('v955: abrir a busca aciona bases, atualiza resultados e prioriza ações e FIIs', {timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{const a=window.DiarioAnalisesPlus;window.__v955calls={acoes:0,fiis:0};a.temDadosBusca=()=>false;a.garantirDados=()=>{window.__v955calls.acoes++;return Promise.resolve()};a.garantirFiis=()=>{window.__v955calls.fiis++;return Promise.resolve()};a.buscarLocal949=()=>[{tipo:'fii',id:'HGLG11',tk:'HGLG11',desc:'Logística'},{tipo:'acao',id:'PETR4',tk:'PETR4',desc:'Petrobras'},{tipo:'tese',id:'1',tk:'PETR4',desc:'Tese'}];});
 const search=p.locator('.dt393-topbar .dt954-search-pill:visible').first();await expect(search).toContainText('Buscar');await search.tap();
 const dlg=p.locator('#dt949-busca');await expect(dlg).toBeVisible();
 const calls=await p.evaluate(()=>window.__v955calls);assert.ok(calls.acoes>=1&&calls.fiis>=1);
 await dlg.locator('#dt949-q').fill('PETR');await expect(dlg.locator('[data-b949-tipo="acao"]').first()).toBeVisible();
 const order=await dlg.locator('[data-b949-tipo]').evaluateAll(els=>els.map(e=>e.dataset.b949Tipo));assert.deepEqual(order.slice(0,3),['acao','fii','tese']);
 await p.evaluate(()=>document.dispatchEvent(new CustomEvent('diario:busca-pronta')));
 await expect(dlg.locator('#dt949-q')).toHaveValue('PETR');await p.close();
}));
