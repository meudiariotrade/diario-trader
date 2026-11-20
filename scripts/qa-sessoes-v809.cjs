/* QA local somente em demo=1, sem conta ou escritas em produção. */
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const label=process.argv[2]||'depois',out='docs/automacao-institucional/evidencias';
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const results=[];
 try{for(const [name,width,height] of [['desktop',1440,900],['iphone',390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},timezoneId:'America/Sao_Paulo',serviceWorkers:'block'});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1')return route.abort();return route.continue();});
 await page.goto('http://127.0.0.1:4173/?demo=1',{waitUntil:'load'});await page.locator('[data-capafecha],#capa button').first().click().catch(()=>{});
 for(const [screen,tab,sub] of [['inicio','home'],['meudia','dia'],['analises','analises'],['noticias','mercado','nt'],['jornal','mercado','jr'],['mercado','mercado','mu']]){
 await page.evaluate(({tab,sub})=>{if(sub)MKT.tab=sub;irPara(tab);},{tab,sub});
 await page.waitForTimeout(1200);
 await page.evaluate(()=>{
  window.__qa={mutations:0,removed:0,cls:0};
  window.__mo=new MutationObserver(ms=>{window.__qa.mutations+=ms.length;for(const m of ms)for(const n of m.removedNodes)if(n.nodeType===1&&n.matches?.('[data-intel-etapa1],[data-intel-etapa2]'))window.__qa.removed++;});
  __mo.observe(document.getElementById('app'),{childList:true,subtree:true});
  window.__po=new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)__qa.cls+=e.value;});__po.observe({type:'layout-shift'});
 });
 await page.waitForTimeout(6000);
 const result=await page.evaluate(()=>{__mo.disconnect();__po.disconnect();return {...__qa,overflow:document.documentElement.scrollWidth>innerWidth+1,technical:/v80[78] · local|Mudanças fundamentalistas verificáveis.*v808/.test(document.getElementById('app').innerText),intelligence:document.querySelectorAll('[data-intel-etapa1]').length,editorial:!!document.querySelector('.jrsec,.jr-magazine,.jornal,.jrbody,.jrcover'),text:document.getElementById('app').innerText.slice(0,300)};});
 await page.screenshot({path:`${out}/${label}-${name}-${screen}.png`,fullPage:false});results.push({viewport:name,screen,...result,errors:[...errors]});
 }await ctx.close();}
 }finally{await browser.close();}
 fs.writeFileSync(`${out}/${label}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({text,...r})=>r),null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
