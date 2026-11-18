'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs');
const {expect}=require('playwright/test');
test('iPhone: navega Técnico Brasil/EUA & Cripto, calcula localmente e desmonta sem duplicar tela',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const diagnostics={screeners:[],candles:[],errors:[],warnings:[]};
 page.on('pageerror',e=>diagnostics.errors.push(String(e?.stack||e).slice(0,350)));
 page.on('console',m=>{if(m.type()==='error')diagnostics.warnings.push(m.text().slice(0,250))});
 const data=Array.from({length:320},(_,i)=>{
  const p=30+i*.10+Math.sin(i/9)*.55;
  return [1700000000+i*86400,p,p+1,p-1,p+.10,100000+(i%20)*200];
 });
 await page.route('**/v1/screeners?**',route=>{
  diagnostics.screeners.push(route.request().url());
  const market=new URL(route.request().url()).searchParams.get('market');
  const symbols=market==='BR'?['PETR4','VALE3','ITUB4']:['AAPL','NVDA'];
  const universe_rows=symbols.map(ticker=>({
   ticker,empresa:ticker,company_name:ticker,
   liquidez_diaria_brl:6000000,avg_daily_volume_usd:5500000,
   score_quant_br:78,score_quant_us:80
  }));
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,market,universe_complete:true,universe_rows,rows:universe_rows})});
 });
 await page.route('**/v1/tecnico-candles?**',route=>{
  diagnostics.candles.push(route.request().url());
  const q=new URL(route.request().url()).searchParams;
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   ok:true,market:q.get('market'),ticker:q.get('ticker'),tf:q.get('tf'),
   source:'Teste local de OHLCV',fetchedAt:new Date().toISOString(),candles:data
  })});
 });
 await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
 await page.evaluate(()=>{tab='analises';render();window.scrollTo(0,0)});
 const nav=page.locator('#an-root nav.an-subs');
 await expect(nav.locator('[data-an-sub]')).toHaveCount(5);
 await nav.locator('[data-an-sub="tecnico-br"]').click();
 await expect(page.locator('#an-title')).toHaveText('Técnico Brasil');
 await expect(page.locator('#an-root .tech-kpis .scr-kpi')).toHaveCount(4);
 try{await expect(page.locator('#an-root .tech-table tbody tr').first()).toBeVisible({timeout:12000});}
 catch(e){
  const snapshot=await page.evaluate(()=>({
   tab:typeof tab==='undefined'?null:tab,
   active:document.querySelector('#an-root [data-tech-root]')?.getAttribute('data-tech-root'),
   status:document.querySelector('#an-root .scr-top [role=status]')?.textContent,
   tableRows:document.querySelectorAll('#an-root .tech-table tbody tr').length,
   html:document.querySelector('#an-root .scr-empty')?.textContent,
   appMounted:!!document.querySelector('#an-root'),
   workerReady:!!window.Worker,
   screenersURL:window.DIARIO_SCREENERS_EDGE_URL||''
  }));
  throw Error('Técnico Brasil sem dados: '+JSON.stringify({snapshot,diagnostics})+' | '+e.message);
 }
 await page.locator('#an-root select[data-tech-change="dir"]').selectOption('sell');
 await expect(page.locator('#an-root select[data-tech-change="dir"]')).toHaveValue('sell');
 await page.locator('#an-root [data-tech-detail="PETR4"]').click();
 await expect(page.locator('#tech-detail')).toBeVisible();
 await nav.locator('[data-an-sub="tecnico-world"]').click();
 await expect(page.locator('#an-title')).toHaveText('Técnico EUA & Cripto');
 await expect(page.locator('#an-root [data-tech-root]')).toHaveCount(1);
 await page.locator('#an-root select[data-tech-change="filter"]').selectOption('crypto');
 await expect(page.locator('#an-root select[data-tech-change="filter"]')).toHaveValue('crypto');
 await nav.locator('[data-an-sub="pesquisa"]').click();
 await expect(page.locator('#an-command')).toBeVisible();
 await expect(page.locator('#an-root [data-tech-root]')).toHaveCount(0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
}));
