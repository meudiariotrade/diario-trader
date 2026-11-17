const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('iPhone: Screeners ficam ao lado de B3 & EUA e preservam Pesquisa',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='analises';render();window.scrollTo(0,0)});
 const nav=page.locator('#an-root nav.an-subs');
 await expect(nav).toHaveCount(1);
 await expect(nav).toBeVisible();
 await expect(nav.locator('[data-an-sub]')).toHaveCount(3);
 const pesquisa=nav.locator('[data-an-sub="pesquisa"]');
 await expect(pesquisa).toContainText('B3 & EUA');
 await expect(pesquisa).toHaveAttribute('aria-selected','true');
 await expect(nav.locator('[data-an-sub="br"]')).toBeVisible();
 await expect(nav.locator('[data-an-sub="us"]')).toBeVisible();
 const pos=await nav.evaluate(el=>({y:el.getBoundingClientRect().y,
   junto:el.closest('.an-screener-switch')!=null,
   antes:el.compareDocumentPosition(document.querySelector('#an-root .an-header'))&Node.DOCUMENT_POSITION_FOLLOWING,
   visible:el.getBoundingClientRect().width>0}));
 assert.equal(pos.junto,true,'barra unica no local da selecao B3 & EUA');
 assert.ok(pos.antes,'sub-abas acima da Pesquisa de Investimentos');
 assert.equal(pos.visible,true,'barra nao pode ficar oculta');
 const tap=await nav.locator('[data-an-sub="br"]').evaluate(el=>{
  const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {acessivel:hit===el||el.contains(hit),y:r.y,viewport:innerHeight,sobreposto:hit?.closest?.('#v4-bnav')!=null};
 });
 assert.equal(tap.acessivel,true,'Screener Brasil precisa aceitar toque sem sobreposicao: '+JSON.stringify(tap));
 await nav.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 await nav.locator('[data-an-sub="br"]').click();
 await expect(page.locator('#an-title')).toHaveText('Screener Brasil');
 await expect(page.locator('#an-root nav.an-subs')).toHaveCount(1);
 await page.locator('#an-root nav.an-subs').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 await page.locator('[data-an-sub="us"]').click();
 await expect(page.locator('#an-title')).toHaveText('Screener EUA');
 await page.locator('#an-root nav.an-subs').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
 await page.locator('[data-an-sub="pesquisa"]').click();
 await expect(page.locator('#an-title')).toHaveText('Análise técnica e fundamentalista');
 await expect(page.locator('#an-command')).toBeVisible();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'sem rolagem lateral no iPhone');
 fs.mkdirSync('test-results',{recursive:true});
 await page.screenshot({path:'test-results/analises-v744-390.png',fullPage:false});
}));
test('Sub-abas nao alteram telas e mantem apenas um container principal',()=>{
 const source=fs.readFileSync('src/analysis/analises.js','utf8');
 assert.match(source,/function subnav\(\)/);
 assert.match(source,/\$\{subnav\(\)\}<\/div><header class="an-header"/);
 assert.match(source,/an-screener-switch/);
 assert.doesNotMatch(source,/\$\{subnav\(\)\}<header class="an-header"/);
 const cfg=JSON.parse(fs.readFileSync('release.config.json','utf8'));
 assert.ok(cfg.version>=744);
});
