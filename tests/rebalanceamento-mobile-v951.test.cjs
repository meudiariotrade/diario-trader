const {test}=require('node:test');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v951: Gestão abre por toque, com carteira vazia e preenchida, e mantém estado após render',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.route('https://**',r=>r.abort());
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{window.pfCalc=()=>({pos:[],v:0,fx:5});tab='carteiras';render()});
 const root=p.locator('#app:not(.v503-fantasma) #rebalanceamento-carteira-v694');
 const header=root.locator(':scope > summary');
 await expect(root).toHaveCount(1);
 await header.tap();await expect(root.locator('.rb694-body')).toBeVisible();
 await expect(root.getByRole('heading',{name:/Novo aporte e rebalanceamento/})).toBeVisible();
 await header.tap();await expect(root.locator('.rb694-body')).toHaveCount(0);
 await p.evaluate(()=>{
  window.pfCalc=()=>({pos:[{tk:'HGLG11',mk:'BR',cl:'fii',q:20,v:2000,custo:1500,setor:'Fundos imobiliários'}],v:2000,fx:5});
  window.DiarioFiis=()=>({rows:[{ticker:'HGLG11',dy:10}]});
  render();
 });
 await header.tap();await expect(root.locator('.rb694-body')).toBeVisible();
 await expect(root.locator('summary').filter({hasText:'Teste de estresse'})).toBeVisible();
 const magic=root.locator('summary').filter({hasText:'Número Mágico'}).last();
 await magic.tap();await expect(root.getByRole('cell',{name:/20 \/ 120/})).toBeVisible();
 await p.evaluate(()=>render());await expect(root.locator('.rb694-body')).toBeVisible();
 await header.tap();await expect(root.locator('.rb694-body')).toHaveCount(0);
 await p.evaluate(()=>render());await expect(root).not.toHaveAttribute('open','');
 await p.close();
}));
