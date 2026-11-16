const {test}=require("node:test");
const assert=require("node:assert/strict");
const {expect}=require("playwright/test");
const {withApp}=require("./helpers/app.cjs");

test("v678: Safari/PWA mantém a mesma IMG nos ticks de preço e desliga lazy/async", {timeout:120000}, async()=>withApp(async(browser,base)=>{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route("https://**",r=>r.abort());
  await page.goto(base+"/?demo=1");
  await page.locator("#splash").waitFor({state:"hidden"});
  const before=await page.evaluate(async()=>{
   tab="mercado";MKT.tab="cq";CQ.aba="fut";CQ.vis="lista";CQ.ord="lista";CQ.search="WIN";
   CQ.d.fut={em:new Date().toISOString(),itens:[
     {c:"WIN",s:"BMFBOVESPA:WIN1!",n:"Mini índice",px:173570,d1:.15,dp:0},
     {c:"WDO",s:"BMFBOVESPA:WDO1!",n:"Mini dólar",px:5601,d1:-.04,dp:1}
   ]};CQ.ts.fut=Date.now();render();
   const row=document.querySelector('#cotbox .cqr[data-market-symbol="BMFBOVESPA:WIN1!"]');
   if(!row)throw Error("a linha WIN deve existir");
   const logo=row.querySelector(".cqm-logo");
   if(!logo)throw Error("ícone memoizado deve existir");
   let img=logo.querySelector("img");
   if(!img){img=document.createElement("img");logo.append(img);}
   // SVG local de teste; independe de TradingView, Finnhub ou rede.
   img.src='data:image/svg+xml,%3Csvg%20xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width=%228%22%20height=%228%22%3E%3Ccircle%20cx=%224%22%20cy=%224%22%20r=%224%22%20fill=%22gold%22%2F%3E%3C%2Fsvg%3E';
   img.setAttribute("loading","lazy");img.setAttribute("decoding","async");img.setAttribute("draggable","true");
   cqLogoAcompanha(document.getElementById("cotbox"));
   window.__webkitLogo=logo;window.__webkitImg=img;
   return {loading:img.getAttribute("loading"),decoding:img.getAttribute("decoding"),draggable:img.getAttribute("draggable")};
  });
  assert.equal(before.loading,null);
  assert.equal(before.decoding,"sync");
  assert.equal(before.draggable,"false");
  await page.evaluate(()=>{
   for(let i=0;i<6;i++){
    CQ.d.fut.itens[0].px=173580+10*i;
    CQ.d.fut.itens[0].d1=.16+i/100;
    cqMorph();
    cqPinta();
   }
  });
  const after=await page.evaluate(()=>{
   const row=document.querySelector('#cotbox .cqr[data-market-symbol="BMFBOVESPA:WIN1!"]');
   const logo=row?.querySelector(".cqm-logo");
   const img=window.__webkitImg;
   return {sameLogo:logo===window.__webkitLogo,sameImg:logo?.contains(img),
     connected:img?.isConnected,
     loading:img?.getAttribute("loading"),decoding:img?.getAttribute("decoding"),
     draggable:img?.getAttribute("draggable"),
     transform:getComputedStyle(logo).transform,
     transition:getComputedStyle(row).transitionProperty,
     last:row?.querySelector(".cqp")?.textContent};
  });
  assert.ok(after.sameLogo&&after.sameImg&&after.connected,"o WebKit não deve receber uma nova IMG a cada cotação");
  assert.equal(after.loading,null);
  assert.equal(after.decoding,"sync");
  assert.equal(after.draggable,"false");
  assert.notEqual(after.transform,"none");
  assert.match(after.transition,/color/);
  assert.doesNotMatch(after.transition,/width|height|transform|all/);
  assert.match(after.last,/173\.630/);
  await page.close();
 }
}));

test("v678: logos oficiais no Mercado usam decoding sync sem onerror que remova a IMG", {timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route("https://**",r=>r.abort());
 await page.goto(base+"/?demo=1");
 await page.locator("#splash").waitFor({state:"hidden"});
 const checks=await page.evaluate(()=>{
  const html=cqLogoHtml(DiarioLogos.html("PBR",20));
  const temp=document.createElement("template");temp.innerHTML=html;
  const img=temp.content.querySelector("img");
  return {contains:!!img,loading:img?.getAttribute("loading"),decoding:img?.getAttribute("decoding"),
    draggable:img?.getAttribute("draggable"),onerror:img?.hasAttribute("onerror")};
 });
 assert.equal(checks.contains,true);
 assert.equal(checks.loading,null);
 assert.equal(checks.decoding,"sync");
 assert.equal(checks.draggable,"false");
 assert.equal(checks.onerror,false);
 await page.close();
}));

test("v678: erro de logo no WebKit oculta textura, mantém IMG e exibe fallback sem desmontar", {timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route("https://**",r=>r.abort());
 await page.goto(base+"/?demo=1");
 await page.locator("#splash").waitFor({state:"hidden"});
 await page.evaluate(()=>{
  tab="mercado";MKT.tab="cq";CQ.aba="fut";CQ.vis="lista";CQ.search="WIN";
  CQ.d.fut={em:new Date().toISOString(),itens:[{c:"WIN",s:"BMFBOVESPA:WIN1!",n:"Mini índice",px:173570,d1:.15,dp:0}]};
  CQ.ts.fut=Date.now();render();
  const root=document.getElementById("cotbox");
  const logo=document.createElement("span");logo.className="dl-logo";logo.dataset.dl="FAKE";logo.style.setProperty("--dl","20px");
  const img=document.createElement("img");img.src="data:image/png;base64,THIS_IS_INVALID";
  img.setAttribute("loading","lazy");img.setAttribute("decoding","async");
  img.setAttribute("onerror","this.remove()");
  logo.append(img);root.append(logo);
  window.__webkitFailedImg=img;window.__webkitFailedLogo=logo;
  cqLogoAcompanha(root);
 });
 await expect.poll(()=>page.evaluate(()=>window.__webkitFailedImg?.dataset.cqmError)).toBe("1");
 const state=await page.evaluate(()=>({
  connected:window.__webkitFailedImg.isConnected,
  stillChild:window.__webkitFailedLogo.contains(window.__webkitFailedImg),
  isFallback:window.__webkitFailedLogo.classList.contains("cqm-img-failed"),
  text:window.__webkitFailedLogo.querySelector(".cqm-logo-fallback")?.textContent,
  loading:window.__webkitFailedImg.getAttribute("loading"),
  decoding:window.__webkitFailedImg.getAttribute("decoding"),
  inlineError:window.__webkitFailedImg.hasAttribute("onerror")
 }));
 assert.equal(state.connected,true);
 assert.equal(state.stillChild,true);
 assert.equal(state.isFallback,true);
 assert.equal(state.text,"FA");
 assert.equal(state.loading,null);
 assert.equal(state.decoding,"sync");
 assert.equal(state.inlineError,false);
 await page.close();
}));


test("v678: ADRs iPhone preservam a imagem mesmo com re-render do painel informativo", {timeout:90000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route("https://**",r=>r.abort());
 await page.goto(base+"/?demo=1");
 await page.locator("#splash").waitFor({state:"hidden"});
 await page.evaluate(()=>{
  const now=Date.now();
  tab="mercado";MKT.tab="cq";CQ.aba="adr";CQ.vis="lista";CQ.search="";CQ.ord="lista";
  AD.list=["PBR","VALE"];AD.data={ts:now,fonte:"fixture",itens:[
   {s:"PBR",n:"Petrobras",state:"reg",regular:{px:14,chp:1.2,at:new Date(now).toISOString(),fonte:"fixture"}},
   {s:"VALE",n:"Vale",state:"reg",regular:{px:11,chp:.8,at:new Date(now).toISOString(),fonte:"fixture"}}
  ]};
  CQ.d.adr={em:new Date(now).toISOString(),itens:[
   {s:"NYSE:PBR",c:"PBR",n:"Petrobras ADR",px:14,d1:1.2,dp:2},
   {s:"NYSE:VALE",c:"VALE",n:"Vale ADR",px:11,d1:.8,dp:2}
  ]};CQ.ts.adr=now;render();
  const row=document.querySelector('#cotbox .cqr[data-market-symbol="NYSE:PBR"]');
  if(!row)throw Error("linha de cotação da ADR PBR não encontrada");
  const logo=row.querySelector(".cqm-logo");
  if(!logo)throw Error("logo de ADR não encontrado");
  let img=logo.querySelector("img");
  if(!img){img=document.createElement("img");img.src='data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%228%22%20height=%228%22%3E%3C/svg%3E';logo.append(img);}
  window.__adrLogo=logo;window.__adrImg=img;
  cqLogoAcompanha(document.getElementById("cotbox"));
 });
 await page.evaluate(()=>{
  for(let i=0;i<5;i++){
   CQ.d.adr.itens[0].px=14+.05*i;
   AD.data.itens[0].regular.px=14+.05*i;
   adrPaint();cqMorph();cqPinta();
  }
 });
 assert.equal(await page.evaluate(()=>{
  const row=document.querySelector('#cotbox .cqr[data-market-symbol="NYSE:PBR"]');
  return row?.querySelector(".cqm-logo")===window.__adrLogo &&
    row.querySelector(".cqm-logo")?.contains(window.__adrImg) && window.__adrImg.isConnected;
 }),true,"A imagem da ADR não pode ser substituída a cada preço");
 await page.close();
}));
