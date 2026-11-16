const { test } = require("node:test");
const assert = require("node:assert/strict");
const { expect } = require("playwright/test");
const { withApp } = require("./helpers/app.cjs");

test("v675: termômetro visível em Início e Meu dia no renderizador V4 real, inclusive após 09:00", {timeout:120000}, async()=>withApp(async(browser,base)=>{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
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
  await page.close();
 }
}));
