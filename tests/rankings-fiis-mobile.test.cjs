const { test } = require('node:test');
const { expect } = require('playwright/test');
const { withApp } = require('./helpers/app.cjs');
const snapshot = require('../dados-publicos/fiis.json');

test('Rankings no celular abre os FIIs, a ficha e volta às ações', async () => {
  await withApp(async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await page.route('**/v1/fiis', route => route.fulfill({ json: snapshot }));
    await page.route('**/v1/analises-plus', route => route.fulfill({ json: {} }));
    await page.route('**/rankings-test', route => route.fulfill({ contentType: 'text/html', body: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>' }));
    await page.goto(base + '/rankings-test');
    await page.addScriptTag({ url: base + '/analises-plus.js' });
    await page.evaluate(() => {
      window.DiarioScreeners = { universo: async () => ({ rows: [{ ticker: 'PETR4' }] }) };
      document.body.innerHTML = DiarioAnalisesPlus.view('rankpro');
      DiarioAnalisesPlus.enter('rankpro');
    });
    await page.locator('[data-ap-ranktipo="fiis"]').tap();
    const fundo = page.locator('article[data-ap-fiisel]').first();
    await expect(fundo).toBeVisible();
    const ticker = await fundo.getAttribute('data-ap-fiisel');
    await fundo.tap();
    await expect(page.locator('.ap-card h3')).toContainText(ticker);
    await page.locator('[data-ap-ranktipo="acoes"]').tap();
    await expect(page.locator('input[data-ap-f="q"]')).toBeVisible();
  });
});
