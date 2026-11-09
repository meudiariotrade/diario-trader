const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

test('interface real: fotos obrigatórias, navegação e cabeçalho em telas pequenas', async () => {
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const executablePath = process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/?demo=1');
    await page.locator('#splash').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Registrar trade', exact: true }).waitFor();
    assert.ok(await page.locator('#wf-demo-banner').isVisible());
    assert.equal(await page.locator('#tape').isVisible(), false);
    await page.getByRole('button', { name: 'Registrar trade', exact: true }).click();
    await page.getByText(/Antes de registrar trade novo, coloque as fotos/).waitFor();
    assert.equal(await page.locator('#sh input[name="entry"]').count(), 0);
    const title = await page.locator('.dt393-title').evaluate(el => ({ text: el.textContent, width: el.clientWidth, full: el.scrollWidth }));
    assert.equal(title.text, 'Operações');
    assert.ok(title.full <= title.width + 1, 'Título de Operações não pode ficar cortado.');
    await page.getByRole('button', { name: 'Meu dia', exact: true }).last().click();
    await page.getByText('Plano do dia', { exact: true }).waitFor();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const title = document.querySelector('.dt393-title');
        const head = document.querySelector('.dt393-topbar');
        const banner = document.getElementById('wf-demo-banner');
        return { width: innerWidth, body: document.documentElement.scrollWidth, title: title.scrollWidth,
          available: title.clientWidth, headTop: head.getBoundingClientRect().top, bannerBottom: banner.getBoundingClientRect().bottom };
      });
      assert.ok(geometry.body <= geometry.width, `Transbordamento global em ${width}px.`);
      assert.ok(geometry.title <= geometry.available + 1, `Título cortado em ${width}px.`);
      assert.ok(geometry.headTop >= geometry.bannerBottom - 1, 'Aviso da demonstração não pode ficar coberto pelo cabeçalho.');
    }
    await page.goto(base + '/');
    await page.locator('#splash').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#wf-demo-banner').count(), 0);
    assert.ok(await page.locator('#tape').isVisible(), 'Ticker real deve continuar disponível.');
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
