const test = require('node:test');
const assert = require('node:assert/strict');
const modulo = import('../supabase/functions/notificar/noticias-urgentes.ts');

test('janela 5 minutos no pregão e 15 fora do horário/fim de semana (Brasília)', async () => {
  const { janelaNoticias } = await modulo;
  const pregao = janelaNoticias(new Date('2026-11-16T15:10:00Z'));
  assert.equal(pregao.pregao, true); assert.equal(pregao.intervalo, 5); assert.equal(pregao.consultar, true);
  const sabado = janelaNoticias(new Date('2026-11-14T15:10:00Z'));
  assert.equal(sabado.pregao, false); assert.equal(sabado.consultar, false);
  assert.equal(janelaNoticias(new Date('2026-11-14T15:15:00Z')).consultar, true);
  assert.equal(janelaNoticias(new Date('2026-11-16T22:05:00Z')).consultar, false);
});

test('limpa sufixos de portais, detecta termos urgentes e não aceita falsos positivos', async () => {
  const { tituloLimpo, mancheteUrgente, assinaturaNoticia, mesmaNoticia } = await modulo;
  assert.equal(tituloLimpo('Fed mantém juros (Reuters)'), 'Fed mantém juros');
  assert.equal(tituloLimpo('Petrobras anuncia resultado - Money Times'), 'Petrobras anuncia resultado');
  assert.equal(mancheteUrgente('Powell comenta FOMC'), true);
  assert.equal(mancheteUrgente('OPEC cuts oil production'), true);
  assert.equal(mancheteUrgente('Bitcoin volta a subir'), true);
  assert.equal(mancheteUrgente('Dicas para estudar melhor'), false);
  assert.equal(mancheteUrgente('Não vale a pena esperar'), false);
  assert.equal(mesmaNoticia(assinaturaNoticia('Fed mantém juros em 4%'), assinaturaNoticia('Fed mantém juros em 4% (Reuters)')), true);
  assert.equal(mesmaNoticia(assinaturaNoticia('Fed mantém juros'), assinaturaNoticia('Fed mantém juros inalterados')), true);
});

test('RSS respeita publicação e URL HTTPS e aceita XML com CDATA', async () => {
  const { lerRSS } = await modulo;
  const xml = '<rss><channel><item><title><![CDATA[Copom mantém Selic (InfoMoney)]]></title><link>https://www.infomoney.com.br/economia/selic/</link><pubDate>Mon, 16 Nov 2026 15:07:00 GMT</pubDate></item><item><title>Fed</title><link>javascript:alert(1)</link><pubDate>Mon, 16 Nov 2026 15:07:00 GMT</pubDate></item></channel></rss>';
  const itens = lerRSS(xml, 'InfoMoney');
  assert.equal(itens.length, 1);
  assert.equal(itens[0].titulo, 'Copom mantém Selic');
  assert.equal(itens[0].link, 'https://www.infomoney.com.br/economia/selic/');
});

test('coleta em paralelo, ignora fontes com falha, notícias antigas e duplicatas', async () => {
  const { coletarNoticias } = await modulo;
  const xml = '<rss><channel><item><title>Fed mantém juros (Reuters)</title><link>https://www.reuters.com/world/2026/fed/</link><pubDate>Mon, 16 Nov 2026 15:08:00 GMT</pubDate></item><item><title>Bitcoin caiu ontem</title><link>https://www.reuters.com/world/2026/btc/</link><pubDate>Sun, 15 Nov 2026 15:08:00 GMT</pubDate></item></channel></rss>';
  const chamadas = [];
  const fetcher = async (url) => {
    chamadas.push(url);
    if (url.includes('finnhub.io')) return { ok: true, json: async () => [{ headline: 'Fed mantém juros', url: 'https://www.reuters.com/world/2026/fed/', datetime: Date.parse('2026-11-16T15:08:00Z') / 1000 }] };
    if (url.includes('translate.googleapis.com')) return { ok: true, json: async () => [[['Fed mantém juros']]] };
    if (url.includes('nitter')) throw Error('ponte fora');
    return { ok: true, text: async () => xml };
  };
  const r = await coletarNoticias('chave-ficticia', new Date('2026-11-16T15:10:00Z'), fetcher);
  assert.equal(r.noticias.length, 1);
  assert.ok(r.fontesOk >= 6);
  assert.ok(chamadas.some((x) => x.includes('finnhub.io')));
  assert.ok(chamadas.some((x) => x.includes('rsshub.app')));
});

test('hash no push_log impede segunda notificação e respeita o link', async () => {
  const { dispararNoticias } = await modulo;
  const agora = new Date('2026-11-16T15:10:00Z');
  const xml = '<rss><channel><item><title>Fed mantém juros (Reuters)</title><link>https://www.reuters.com/world/fed/</link><pubDate>Mon, 16 Nov 2026 15:09:00 GMT</pubDate></item></channel></rss>';
  const historico = [], envios = [];
  const cliente = { from: (table) => {
    assert.equal(table, 'push_log');
    return { select: () => ({ like: () => ({ gte: () => ({ order: () => ({ limit: async () => ({ data: historico, error: null }) }) }) }) }) };
  } };
  const fetcher = async (url) => {
    if (url.includes('translate.googleapis.com')) return { ok: true, json: async () => [[['Fed mantém taxas de juros']]] };
    return { ok: true, text: async () => xml };
  };
  const enviar = async (_sub, payload, chave) => {
    envios.push({ payload, chave });
    historico.push({ chave, payload, em: agora.toISOString(), status: 'enviado' });
    return true;
  };
  const opts = { cliente, subs: [{ id: 'sub1' }], enviar, token: '', agora, fetcher };
  const a = await dispararNoticias(opts), b = await dispararNoticias(opts);
  assert.equal(a.enviados, 1); assert.equal(b.enviados, 0);
  assert.equal(envios.length, 1);
  assert.match(envios[0].chave, /^sub1\|urg\|[a-f0-9]{32}$/);
  assert.equal(envios[0].payload.title, 'Fed mantém juros');
  assert.equal(envios[0].payload.data.url, 'https://www.reuters.com/world/fed/');
});

test('evita dois pushes quando fontes em português e inglês noticiam o mesmo evento', async () => {
  const { dispararNoticias } = await modulo;
  const agora = new Date('2026-11-16T15:10:00Z');
  const xml = '<rss><channel><item><title>Fed mantém juros</title><link>https://www.infomoney.com.br/fed/</link><pubDate>Mon, 16 Nov 2026 15:09:00 GMT</pubDate></item></channel></rss>';
  const enviados = [];
  const fetcher = async (url) => {
    if (url.includes('finnhub.io')) return { ok: true, json: async () => [{ headline: 'Fed holds interest rates', url: 'https://www.cnbc.com/fed.html', datetime: Date.parse('2026-11-16T15:09:00Z') / 1000 }] };
    if (url.includes('translate.googleapis.com')) return { ok: true, json: async () => [[['Fed mantém juros']]] };
    return { ok: true, text: async () => xml };
  };
  const cliente = { from: () => ({ select: () => ({ like: () => ({ gte: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) }) }) };
  const r = await dispararNoticias({ cliente, subs: [{ id: 'sub1' }], enviar: async (_, payload) => { enviados.push(payload); return true; }, token: 'ficticia', agora, fetcher });
  assert.equal(r.enviados, 1);
  assert.equal(enviados[0].title, 'Fed mantém juros');
});
