const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
globalThis.Deno = { env: { get: () => '' }, serve: () => {} };
const modulo = import('../supabase/functions/noticias/index.ts');

test('v726: FirstSquawk e DeItaone: RSS retorna título, link e data sem inventar notícias', async () => {
  const { parseX } = await modulo;
  const now = Date.parse('2026-11-17T12:20:00Z');
  const xml = '<rss><channel><item><title><![CDATA[FED SIGNALS CAUTION ON RATES]]></title><link>https://x.com/FirstSquawk/status/2122665663923994635</link><pubDate>Tue, 17 Nov 2026 12:18:26 GMT</pubDate></item><item><title>Falso</title><link>https://outro.site/falso</link><pubDate>Tue, 17 Nov 2026 12:18:26 GMT</pubDate></item></channel></rss>';
  const posts = parseX(xml, 'FirstSquawk', now);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].a, 'X · @FirstSquawk');
  assert.equal(posts[0].t, 'FED SIGNALS CAUTION ON RATES');
  assert.equal(posts[0].l, 'https://x.com/FirstSquawk/status/2122665663923994635');
  assert.ok(posts[0].c.includes('x'));
  assert.ok(posts[0].c.includes('breaking'));
  assert.equal(parseX(xml, 'outroperfil', now).length, 0);
});
test('v726: feed antigo não aparece como última hora', async () => {
  const { parseX } = await modulo;
  const xml = '<item><title>US STOCKS SLUMP AFTER FED REPORT</title><link>https://x.com/DeItaone/status/2122664670314017239</link><pubDate>Mon, 02 Nov 2026 12:14:29 GMT</pubDate></item>';
  assert.equal(parseX(xml, 'DeItaone', Date.parse('2026-11-17T12:20:00Z')).length, 0);
});
test('v726: frontend não tenta RSSHub e Nitter para o X, conserva os filtros', () => {
  const client = fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
  assert.ok(client.includes('["x", "X / Breaking"]'));
  assert.ok(client.includes('mkEdgeNoticias("noticias")'));
  assert.ok(client.includes('MKT.fontesX = obj.fontesX || null;'));
  assert.ok(client.includes('if (accepted.length === 100) break;'));
  assert.doesNotMatch(client,/rsshub\.app\/twitter\/user\//);
  assert.doesNotMatch(client,/nitter\.mie\.foundation/);
});
