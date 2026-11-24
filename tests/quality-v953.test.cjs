const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/analysis/analises.js','utf8');
test('v953: mediana real ignora lacunas, preserva zeros e distingue dividendo de retorno total',()=>{
 const data={universe_complete:true,universe_rows:[{roe:null,dividend_yield:null,total_shareholder_yield:8},{roe:10,dividend_yield:0,total_shareholder_yield:4},{roe:20,dividend_yield:2,total_shareholder_yield:6},{roe:'',dividend_yield:'',total_shareholder_yield:null}]};
 const c={snapshotMemory:new Map([['US',{data}]])};
 vm.runInNewContext(src.slice(src.indexOf('function mediana953('),src.indexOf('function localScreener(')),c);
 const m=c.medianasMercado('us');assert.equal(m.roe,15);assert.equal(m.dy,1);assert.equal(m.total_yield,6);assert.equal(m.n,4);
 data.universe_complete=false;assert.equal(c.medianasMercado('us'),null);
 assert.equal(c.mediana953([{a:null},{a:''}],'a'),null);
});
test('v953: explicação EUA usa IA autenticada, cache por conta e sem Cérebro legado',async()=>{
 const store=new Map(),requests=[],box={isConnected:true,innerHTML:''};
 const row={ticker:'AAPL',preco_referencia:200,roe:20};
 const c={Date,AbortSignal,owner:()=> 'u1',SESS:{uid:'u1',at:'token'},tok:async()=>{},fmt:String,E:String,medianasMercado:()=>null,sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},w:{fetch:async(url,opts)=>{requests.push({url,opts});return {ok:true,status:200,json:async()=>({ok:true,text:'Parecer da IA com os números informados.'})}}},d:{querySelectorAll:()=>[]}};
 vm.runInNewContext(src.slice(src.indexOf('const iaChave='),src.indexOf('/* v852: logotipo')),c);
 await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);
 assert.equal(requests.length,1);assert.match(requests[0].url,/\/v1\/aurea-resumao$/);assert.equal(requests[0].opts.headers.Authorization,'Bearer token');assert.equal(requests[0].opts.cache,'no-store');assert.match(JSON.parse(requests[0].opts.body).prompt,/200 USD/);assert.match(box.innerHTML,/Parecer da IA/);
 await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);assert.equal(requests.length,1);
 c.owner=()=> 'u2';c.SESS={uid:'u2',at:'token2'};await c.explicarIA('AAPL','us',{data:{rows:[row]},selectedRows:{}},box);assert.equal(requests.length,2);
});

// v963: regressão real de geometria e ciclo de vida do Pulso do Mercado, sem rede.
test('v963 Mercado mobile: Carteira não cobre indicadores, painel estável e busca sem autozoom',{timeout:60000},async()=>{
 const {chromium}=require('playwright');
 const source=fs.readFileSync('src/domains/layers/02-carteira-e-terminal.js','utf8');
 const module=source.slice(source.indexOf('/* v962: Mercado Pro'));
 const css=fs.readFileSync('src/app-theme.css','utf8');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH|| (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
   await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><body class="mkt549"><main id="app" style="width:100%;box-sizing:border-box;padding:12px"><nav class="m403-primary-tabs"><button class="on" data-navroute="mercado:cq">Cotações</button></nav><div class="market-categories">Categorias</div><input placeholder="Buscar ativo"><div class="cqr">PETR4</div><div class="cqr" style="display:none">VALE3</div></main></body>');
   await page.addStyleTag({content:css});
   await page.evaluate(()=>{window.S={carteira:[{ticker:'PETR4'}]};window.CQ={q:{IBOV:{pct:-0.43},USDBRL:{pct:0.2},SPX:{pct:1.1},VIX:{pct:-0.1}}};});
   await page.addScriptTag({content:module});
   await page.locator('#dt962-pulso').waitFor();
   const geometry=await page.evaluate(()=>{const box=document.querySelector('#dt962-pulso'),cart=box.querySelector('.dt962-cart-btn').getBoundingClientRect(),pills=[...box.querySelectorAll('.dt962-pill')].map(x=>x.getBoundingClientRect());const b=box.getBoundingClientRect();return {count:pills.length,nonOverlap:pills.every(x=>x.top>=cart.bottom-1&&x.left>=b.left-1&&x.right<=b.right+1),font:parseFloat(getComputedStyle(document.querySelector('input')).fontSize),width:document.documentElement.scrollWidth,inner:innerWidth};});
   assert.equal(geometry.count,4);assert.equal(geometry.nonOverlap,true,JSON.stringify(geometry));assert.ok(geometry.font>=16);assert.ok(geometry.width<=geometry.inner+1);
   await page.evaluate(()=>{window.__cart=document.querySelector('.dt962-cart-btn');window.__panel=document.querySelector('#dt962-pulso');window.CQ.q.IBOV.pct=1.25;document.querySelector('.cqr').append(' ');});
   await page.waitForFunction(()=>document.querySelector('.dt962-val').textContent.includes('1,25'));
   assert.equal(await page.evaluate(()=>window.__cart===document.querySelector('.dt962-cart-btn')&&window.__panel===document.querySelector('#dt962-pulso')),true);
   await page.locator('.dt962-cart-btn').click();await page.locator('.dt962-cart-btn').click();
   assert.equal(await page.locator('.cqr').nth(1).evaluate(el=>el.style.display),'none','preserva o filtro nativo');
   await page.evaluate(()=>{document.querySelector('#dt962-pulso').remove();window.dispatchEvent(new Event('diario:render'));});
   assert.equal(await page.locator('#dt962-pulso').count(),1);
   await page.close();
  }
 }finally{await browser.close();}
});
