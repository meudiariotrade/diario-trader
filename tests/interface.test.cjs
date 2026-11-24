const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withApp } = require('./helpers/app.cjs');

test('interface real: fotos obrigatórias, navegação e cabeçalho em telas pequenas', async () => {
  await withApp(async (browser, base) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/?demo=1');
    await page.locator('#splash').waitFor({ state: 'hidden' });
    await page.locator('#fabm [data-a="new"][data-tp="D"]').waitFor({ state: 'attached' });
    assert.ok(await page.locator('#wf-demo-banner').isVisible());
    assert.equal(await page.locator('#tape').isVisible(), false);
    await page.evaluate(() => document.querySelector('#fabm [data-a="new"][data-tp="D"]').click()); // v563: sem atalho no Início
    await page.getByText(/Antes de registrar trade novo, coloque as fotos/).waitFor();
    assert.equal(await page.locator('#sh input[name="entry"]').count(), 0);
    const title = await page.locator('.dt393-title').evaluate(el => ({ text: el.textContent, width: el.clientWidth, full: el.scrollWidth }));
    assert.equal(title.text, 'Operações');
    assert.ok(title.full <= title.width + 1, 'Título de Operações não pode ficar cortado.');
    await page.getByRole('button', { name: 'Rotina', exact: true }).last().click();
    await page.getByText('Plano do dia', { exact: true }).waitFor();
    for (const width of [320, 360, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const title = document.querySelector('.dt393-title');
        const head = document.querySelector('.dt393-topbar');
        const banner = document.getElementById('wf-demo-banner');
        const actions=[...head.querySelectorAll('.dt393-menubtn,.dt393-topactions button')].filter(b=>b.getClientRects().length).map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height,right:b.getBoundingClientRect().right}));
        return { actions, width: innerWidth, body: document.documentElement.scrollWidth, title: title.scrollWidth,
          available: title.clientWidth, headTop: head.getBoundingClientRect().top, bannerBottom: banner.getBoundingClientRect().bottom };
      });
      assert.ok(geometry.body <= geometry.width, `Transbordamento global em ${width}px.`);
      assert.ok(geometry.title <= geometry.available + 1, `Título cortado em ${width}px.`);
      if(width<=360)assert.ok(geometry.actions.every(b=>b.w>=39&&b.h>=39&&b.right<=width+1),'Ações do cabeçalho devem caber e manter alvos de toque.');
      assert.ok(geometry.headTop >= geometry.bannerBottom - 1, 'Aviso da demonstração não pode ficar coberto pelo cabeçalho.');
    }
    await page.goto(base + '/');
    await page.locator('#splash').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#wf-demo-banner').count(), 0);
    assert.ok(await page.locator('#tape').isVisible(), 'Ticker real deve continuar disponível.');
    assert.deepEqual(errors, []);
  });
});
