const { test } = require('node:test');
const assert = require('node:assert/strict');
const { expect } = require('playwright/test');
const { withApp } = require('./helpers/app.cjs');

test('Estudos: meta única, sessões vinculadas, navegação, biblioteca e controles mobile', { timeout: 90_000 }, async () => withApp(async (browser, base) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const app = page.locator('#app:not(.v503-fantasma)');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/?demo=1');
  await page.locator('#splash').waitFor({ state: 'hidden' });
  // Fixture apenas na base demonstrativa, com uma sessão que já contabilizou 15 minutos.
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('diario-trader-demo-v286');
    request.onerror = reject;
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('kv', 'readwrite'), store = tx.objectStore('kv');
      const query = store.get('s');
      query.onsuccess = () => {
        const state = query.result;
        const date = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
        state.ax = { ...state.ax, foco: [{ d: date, mat: 'ing', min: 15 }] };
        store.put(state, 's');
      };
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = reject;
    };
  }));
  await page.evaluate(() => localStorage.setItem('v514-meta-est', '420'));
  await page.reload();
  await page.locator('#splash').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Estudos', exact: true }).last().click();
  assert.equal(await app.locator('.dt397-category [data-dt397-view]').count(), 4);
  await page.locator('.v503-fantasma').waitFor({ state: 'detached' });
  await expect(app.locator('.dt397-library-grid')).toBeVisible();
  await expect.poll(() => app.locator('.dt397-library-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  await app.locator('.dt397-category [data-dt397-view="est"]').click();
  await app.locator('[data-est-meta-legado="420"]').waitFor();
  assert.ok((await app.locator('#v514-meta').innerText()).includes('180 min sugeridos'), 'A meta global antiga não é atribuída automaticamente à conta.');
  await app.locator('#v514-meta-in').fill('300');
  await app.locator('[data-v514="meta"]').click();
  await page.waitForTimeout(400);
  assert.ok((await app.locator('#v514-meta summary').innerText()).includes('15 / 300'));
  assert.equal(await app.locator('[data-est-meta-legado]').count(), 0);
  assert.ok((await app.innerText()).includes('meta 5h'));

  await app.locator('[data-estv="reg"]').first().click();
  await app.locator('#estmat').selectOption('ing');
  await app.locator('#esttempo option[value="0"]').waitFor({ state: 'attached' });
  await app.locator('#esttempo').selectOption('0');
  assert.equal(await app.locator('#estmin').inputValue(), '15');
  await app.locator('#esttop').fill('Oferta e demanda');
  await app.locator('#estnota').fill('Nota da sessão vinculada');
  await app.locator('[data-estsalva]').click();
  await app.getByText('Nota da sessão vinculada', { exact: false }).first().waitFor();
  assert.ok((await app.locator('#v514-meta summary').innerText()).includes('15 / 300'), 'Vínculo não soma o mesmo tempo novamente.');

  await app.locator('.dt397-category [data-dt397-view="liv"]').click();
  assert.equal(await app.locator('.est-book-add').getAttribute('open'), null);
  assert.ok(await app.locator('[data-est-book-row]').first().isVisible());
  await app.locator('[data-est-book-search]').fill('livro inexistente');
  assert.ok(await app.locator('.est-book-empty').isVisible());
  await app.locator('[data-est-book-search]').fill('candlestick');
  assert.ok(await app.locator('[data-est-book-row]').first().isVisible());
  await app.locator('.est-book-add>summary').click();
  assert.ok(await app.locator('#bt').isVisible());
  assert.ok(await app.locator('.est-book-add input[type="file"]').count());

  await app.locator('[data-dt401-more-toggle]').click();
  await page.keyboard.press('Escape');
  assert.equal(await app.locator('[data-dt401-more-toggle]').getAttribute('aria-expanded'), 'false');
  await app.locator('[data-dt401-more-toggle]').click();
  await app.locator('#dt401-more-list [data-dt397-view="foco"]').click();
  assert.ok((await app.innerText()).includes('de 300 min'));
  assert.equal(await app.locator('.dt397-hero').isVisible(), false);
  await app.locator('[data-dt401-more-toggle]').click();
  await app.locator('#dt401-more-list [data-dt397-view="aul"]').click();
  await page.getByRole('button', { name: 'Entrar na minha conta', exact: true }).waitFor();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
      filters: [...document.querySelectorAll('[data-austfilter]')].map(el => ({ width: el.clientWidth, content: el.scrollWidth, wrap: getComputedStyle(el).whiteSpace })) }));
    assert.ok(layout.scroll <= layout.width, 'Transbordamento em ' + width);
    for (const item of layout.filters) { assert.ok(item.content <= item.width + 1); assert.equal(item.wrap, 'nowrap'); }
  }
  await app.locator('.dt397-category [data-dt397-view="sim"]').click();
  await app.locator('[data-e2tema]').click();
  await app.locator('[data-e2op]').first().waitFor();
  await page.locator('.v503-fantasma').waitFor({ state: 'detached' });
  assert.equal(await app.locator('.dt397-studies').count(), 1, 'A central deve ser única após a transição visual.');
  assert.equal(await app.locator('.dt397-hero').isVisible(), false);
  assert.equal(await app.locator('#v514-meta').isVisible(), false);
  await page.reload();
  await page.locator('#splash').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Estudos', exact: true }).last().click();
  await app.locator('.dt397-category [data-dt397-view="est"]').click();
  await app.locator('#v514-meta summary').waitFor();
  assert.ok((await app.locator('#v514-meta summary').innerText()).includes('15 / 300'), 'Meta e tempo vinculado devem persistir ao reabrir.');
  assert.deepEqual(errors, []);
}));
