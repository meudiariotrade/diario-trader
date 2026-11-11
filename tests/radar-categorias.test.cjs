const {test}=require('node:test');const assert=require('node:assert/strict');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('radar sem menu duplicado: referências exclusivas nas categorias, fontes e curva DI preservadas',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));const app=p.locator('#app:not(.v503-fantasma)');
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.getByRole('button',{name:'Mercado',exact:true}).last().click();
 // Dados fictícios apenas no banco demonstrativo; não escreve em contas ou fontes reais.
 await p.evaluate(()=>{const codes=['^BVSP','^GSPC','^IXIC','DXY','EWZ','PBR','VALE','ES=F','NQ=F','YM=F','BRL=X','BRENT','WTI','IRON','GOLD','SELIC','DI1F27','US10Y'];MDO.v={em:'2026-11-09T14:30:00Z',mercados:{em:'2026-11-09T14:30:00Z',fontes:{tv:18,yahoo:0},grupos:[{g:'Fixture demonstrativa',itens:codes.map(s=>({s,n:s,px:100,d1:1,fonte:'Fonte da fixture',horarioPreco:'2026-11-09T14:30:00Z'}))}]}};for(const cat of ['idx','fx','adr','fut','cmd','jur']){CQ.d[cat]={itens:[],em:new Date().toISOString()};CQ.ts[cat]=Date.now()}AD.data=null;CQ.aba='idx';render()});
 await expect(app.locator('.simple-category-references')).toBeVisible();
 await expect(app.locator('.m406-radar-details')).toHaveCount(0);
 await expect(app.locator('.m405-section-nav')).toHaveCount(0);
 await expect(app.locator('[data-m408-radar]')).toHaveCount(0);
 const expected={idx:['^BVSP','^GSPC','^IXIC'],fx:['DXY','BRL=X'],adr:['EWZ','PBR','VALE'],fut:['ES=F','NQ=F','YM=F'],cmd:['BRENT','WTI','IRON','GOLD'],jur:['SELIC','DI1F27','US10Y']};
 for(const [category,codes]of Object.entries(expected)){
  await app.locator('.cqtabs [data-cqa="'+category+'"]').evaluate(b=>b.click()); // v549: categorias extras ficam em "Outros"
  const rows=app.locator('.simple-category-references .m405-quote:visible');
  await expect(rows).toHaveCount(codes.length);
  await expect.poll(()=>rows.evaluateAll(ns=>ns.map(n=>n.dataset.panoramaSymbol).sort())).toEqual(codes.slice().sort());
  for(const label of await rows.locator('.m405-quote-source').allTextContents()){assert.match(label,/Fonte da fixture/);assert.match(label,/09\/11\/2026/)}
  await expect(app.locator('.simple-market-sources')).toHaveCount(1);
 }
 // A lista nativa de ADRs também tem prioridade sobre a cópia do panorama.
 await p.evaluate(()=>{AD.list=['EWZ','PBR','VALE'];AD.data={em:new Date().toISOString(),itens:[{s:'EWZ',n:'ETF Brasil',regular:{px:99,chp:1,at:'2026-11-09T14:30:00Z',fonte:'Fonte nativa'}}]}});
 await app.locator('.cqtabs [data-cqa="adr"]').evaluate(b=>b.click());
 await expect(app.locator('.simple-category-references .m405-quote:visible')).toHaveCount(2);
 await expect(app.locator('.simple-category-references [data-panorama-symbol="EWZ"]')).toBeHidden();
 // O botão Atualizar de cima conserva também a atualização do panorama.
 await p.evaluate(()=>{window.panoramaRefreshes=0;document.addEventListener('click',e=>{if(e.target.closest('.simple-category-references [data-m405-action="refresh"]'))window.panoramaRefreshes++})});
 await app.locator('[data-mkt549-refresh]').click(); // v549: atualizar fica dentro da busca
 assert.equal(await p.evaluate(()=>window.panoramaRefreshes),1);
 // Uma cotação válida já exibida em cima não é repetida como referência.
 await p.evaluate(()=>{CQ.d.idx.itens=[{s:'BMFBOVESPA:IBOV',n:'Ibovespa',px:101,d1:1}];CQ.aba='idx';render()});
 await expect(app.locator('.simple-category-references .m405-quote:visible')).toHaveCount(2);
 await expect(app.locator('.simple-category-references [data-panorama-symbol="^BVSP"]')).toBeHidden();
 // Sem dado nativo válido, a referência volta a aparecer; não se inventa valor.
 await p.evaluate(()=>{CQ.d.idx.itens[0].px=null;render()});
 await expect(app.locator('.simple-category-references .m405-quote:visible')).toHaveCount(3);
 await app.locator('.cqtabs [data-cqa="jur"]').evaluate(b=>b.click());
 await app.getByRole('button',{name:'Ver curva DI no Terminal',exact:true}).click();
 await expect(app.locator('#tf413')).toHaveClass(/t428-p-DIFUT/);
 assert.deepEqual(errors,[]);
}));
