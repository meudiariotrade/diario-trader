const { test } = require("node:test");
const assert = require("node:assert/strict");
const { expect } = require("playwright/test");
const { withApp } = require("./helpers/app.cjs");

test("v675: termômetro visível em Início e Meu dia no renderizador V4 real, inclusive após 09:00", {timeout:120000}, async()=>withApp(async(browser,base)=>{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.route("https://**",r=>r.abort());
  await page.goto(base+"/?demo=1");
  await page.locator("#splash").waitFor({state:"hidden"});
  await page.clock.setFixedTime(new Date("2026-11-16T13:40:00Z")); // 10:40 BRT
  await page.evaluate(()=>{tab="home";render();});
  const home=page.locator("#app .v4-panel .v4-page.v4-home");
  await expect(home).toBeVisible();
  await expect(home.locator(":scope > .dt670-opening")).toBeVisible();
  await expect(home.locator(":scope > .dt670-opening")).toHaveCount(1);
  assert.equal(await home.evaluate(el=>el.querySelector(".v4-summary")?.nextElementSibling?.classList.contains("dt670-opening")),true);
  await page.evaluate(()=>{tab="dia";render();});
  const dia=page.locator("#app .v4-panel .v4-page.v4-day");
  await expect(dia).toBeVisible();
  await expect(dia.locator(":scope > .dt670-opening")).toBeVisible();
  await expect(dia.locator(":scope > .dt670-opening")).toHaveCount(1);
  await page.evaluate(()=>{tab="mercado";MKT.tab="cq";render();});
  await expect(page.locator("#app .dt395-native-mercado .dt670-opening")).toBeVisible();
  await page.evaluate(()=>{tab="ops";render();});
  await expect(page.locator("#app .dt670-opening")).toHaveCount(0);
  assert.deepEqual(errors,[],"o renderizador V4 não deve disparar erros JavaScript");
  await page.close();
 }
}));


test("v676: termômetro permanece montado após atualizações repetidas de Início/Meu dia", {timeout:90000}, async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route("https://**",r=>r.abort());
 await page.goto(base+"/?demo=1");
 await page.locator("#splash").waitFor({state:"hidden"});
 for(const route of ["home","dia","home","dia"]){
   await page.evaluate(route=>{tab=route;render();render();},route);
   const container=page.locator(route==="home"?"#app .v4-panel .v4-page.v4-home":"#app .v4-panel .v4-page.v4-day");
   await expect(container).toBeVisible();
   await expect(container.locator(":scope > .dt670-opening")).toHaveCount(1,{timeout:10000});
 }
 await page.close();
}));
