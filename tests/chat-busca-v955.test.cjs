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

test('v955: Panorama usa o Brent confirmado no snapshot mesmo com Macro antigo',()=>{
 const vm=require('node:vm'),src=fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8');
 const agora=Date.parse('2026-11-24T10:22:00Z'),ts='2026-11-24T10:20:49.000Z';
 const q={s:'ICEEUR:BRN1!',simboloFonte:'ICEEUR:BRNF2027',px:89.15,d1:-0.24616761776882495,fechamentoAnterior:89.37,horarioPreco:ts,quoteStatus:'coerente'};
 const snapshot={atualizadoEm:'2026-11-24T10:20:56.842Z',mercados:{grupos:[{itens:[q]}]}};
 const ctx={MDO:{v:{mercados:{grupos:[{itens:[{s:'BZ=F',px:86.4,d1:-3.32}]}]}}}};
 vm.runInNewContext(src.slice(src.indexOf('const IMG = { busy: 0 }'),src.indexOf('async function imgDados()'))+';this.IMG=IMG;',ctx);
 ctx.IMG.brent955=ctx.imgBrent955(snapshot,agora);assert.equal(ctx.imgQ('BZ=F').px,89.15);assert.equal(ctx.imgQ('BZ=F').d1,q.d1);
 assert.equal(ctx.imgBrent955({...snapshot,cacheOffline:true},agora),null);assert.equal(ctx.imgBrent955(snapshot,agora+3600000),null);
 assert.equal(ctx.imgBrent955({...snapshot,mercados:{grupos:[{itens:[{...q,d1:-3.32}]}]}},agora),null);
});
