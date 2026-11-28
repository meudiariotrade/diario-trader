'use strict';
// v1062 (Fase D): rotinas do agendador rodam na Cloudflare; o Supabase só é chamado como reserva.
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const locais = () => import('../cloudflare/diario-radar/funcoes-locais-v1062.mjs');
const agenda = () => import('../cloudflare/diario-radar/agenda-v932.mjs');
const SB = 'https://vdzwydizostutukppcsj.supabase.co';
const SELF_OK = { fetch: async () => new Response('{}', { status: 200 }) };

test('v1062: só as rotinas portadas rodam localmente e dá para desligar', async () => {
  const { rodaLocalV1062, FUNCOES_LOCAIS_V1062 } = await locais();
  assert.deepEqual([...FUNCOES_LOCAIS_V1062].sort(), ['notificar', 'rotina-cron']);
  assert.equal(rodaLocalV1062('notificar', { SELF: SELF_OK }), true);
  assert.equal(rodaLocalV1062('resumo', { SELF: SELF_OK }), false);
  assert.equal(rodaLocalV1062('movimentos', { SELF: SELF_OK }), false, 'fica no Supabase (limite de 50 chamadas do plano gratuito)');
  assert.equal(rodaLocalV1062('notificar', {}), false);
  assert.equal(rodaLocalV1062('notificar', { SELF: SELF_OK, FUNCOES_LOCAIS_V1062: '0' }), false);
});

test('v1062: mercados/agenda/ADRs das rotinas vêm do cache público da Cloudflare', async () => {
  const { rotaPublicaV1062 } = await locais();
  const post = (b) => ({ method: 'POST', body: JSON.stringify(b) });
  assert.equal(rotaPublicaV1062(SB + '/functions/v1/macro', post({})), 'https://diario-trader.lucianosilva43567.workers.dev/v1/macro?');
  assert.equal(rotaPublicaV1062(SB + '/functions/v1/macro', post({ modo: 'agenda', semana: 0 })), 'https://diario-trader.lucianosilva43567.workers.dev/v1/macro?modo=agenda&semana=0');
  assert.equal(rotaPublicaV1062(SB + '/functions/v1/macro', post({ modo: 'diag' })), null);
  assert.match(rotaPublicaV1062(SB + '/functions/v1/adrs', post({ symbols: ['ewz', 'PBR', 'x<y'] })), /\/v1\/adrs\?s=EWZ%2CPBR%2CXY$/);
  assert.equal(rotaPublicaV1062(SB + '/functions/v1/analise', post({})), null);
  assert.equal(rotaPublicaV1062('https://evil.example/functions/v1/macro', post({})), null);
  assert.equal(rotaPublicaV1062(SB + '/functions/v1/macro', { method: 'GET' }), null);
});

test('v1062: rota interna exige o segredo do agendador e as chaves; senão devolve 503 (reserva)', async () => {
  const { funcaoLocalV1062 } = await locais();
  const req = (nome, seg) => new Request('https://diario-radar.interno/v1/fn-local/' + nome, { method: 'POST', headers: seg ? { 'x-cron-secret': seg } : {}, body: '{}' });
  const env = { CRON_SECRET: 'c'.repeat(32), SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(48) };
  const op = { semVault: true, segredo: async () => null };
  assert.equal(await funcaoLocalV1062(new Request('https://x/v1/outra', { method: 'POST' }), env, null, op), null);
  assert.equal((await funcaoLocalV1062(req('notificar'), env, null, op)).status, 401);
  assert.equal((await funcaoLocalV1062(req('notificar', 'c'.repeat(31) + 'd'), env, null, op)).status, 401);
  assert.equal((await funcaoLocalV1062(req('analise', env.CRON_SECRET), env, null, op)).status, 404);
  const r = await funcaoLocalV1062(req('notificar', env.CRON_SECRET), env, null, op);
  assert.equal(r.status, 503, 'sem VAPID no Worker nem no D1');
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
});

test('v1062: VAPID vem do D1 quando não está nas variáveis do Worker', async () => {
  const { leitorV1062 } = await locais();
  const pedidos = [];
  const ler = await leitorV1062({ CRON_SECRET: 'x' }, { semVault: true, segredo: async (n) => { pedidos.push(n); return 'valor-' + n; } });
  assert.equal(ler('VAPID_PUBLIC'), 'valor-diario_vapid_public');
  assert.equal(ler('VAPID_PRIVATE'), 'valor-diario_vapid_private');
  assert.equal(ler('SUPABASE_URL'), SB);
  assert.equal(ler('CRON_SECRET'), 'x');
  assert.deepEqual(pedidos.sort(), ['diario_vapid_private', 'diario_vapid_public', 'diario_vapid_subject']);
});

function envAgenda(self) {
  const locked = new Set();
  return { AGENDA_CUTOVER_ENABLED: '1', SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(48), CRON_SECRET: 'c'.repeat(32), SELF: self,
    HISTORICO: { prepare(sql) { let a = []; return { bind(...v) { a = v; return this; }, async run() { if (sql.startsWith('INSERT')) { const k = a.join(':'); if (locked.has(k)) return { meta: { changes: 0 } }; locked.add(k); } return { meta: { changes: 1 } }; } }; } } };
}
const SABADO_0905 = Date.parse('2026-11-28T09:05:00Z'); // só notificar-leve-v724 e noticias-urgentes (15 min não) → notificar

test('v1062: agenda usa a Cloudflare e não chama o Supabase quando ela responde', async () => {
  const { runAgendaV932, jobsAtV932 } = await agenda();
  assert.deepEqual(jobsAtV932(SABADO_0905).map((j) => j.fn), ['notificar']);
  const internas = [];
  const env = envAgenda({ fetch: async (url, init) => { internas.push({ url, init }); return new Response('{"ok":true}', { status: 200 }); } });
  const old = global.fetch; let externas = 0; global.fetch = async () => { externas++; return new Response(null, { status: 204 }); };
  try {
    const r = await runAgendaV932({ cron: '* * * * *', scheduledTime: SABADO_0905 }, env);
    assert.deepEqual(r.results.map((x) => x.state), ['ok']);
    assert.equal(externas, 0, 'nenhuma chamada ao Supabase');
    assert.equal(internas[0].url, 'https://diario-radar.interno/v1/fn-local/notificar');
    assert.equal(internas[0].init.headers['x-cron-secret'], env.CRON_SECRET);
    assert.deepEqual(JSON.parse(internas[0].init.body), { acao: 'tick_leve' });
  } finally { global.fetch = old; }
});

test('v1062: se a Cloudflare falhar (503/erro), a mesma rotina vai para o Supabase', async () => {
  const { runAgendaV932 } = await agenda();
  for (const self of [{ fetch: async () => new Response('{}', { status: 503 }) }, { fetch: async () => { throw new Error('rede'); } }]) {
    const env = envAgenda(self), chamadas = [];
    const old = global.fetch; global.fetch = async (url, init) => { chamadas.push({ url: String(url), init }); return new Response(null, { status: 200 }); };
    try {
      const r = await runAgendaV932({ cron: '* * * * *', scheduledTime: SABADO_0905 }, env);
      assert.deepEqual(r.results.map((x) => x.state), ['ok']);
      assert.equal(chamadas.length, 1);
      assert.equal(chamadas[0].url, SB + '/functions/v1/notificar');
      assert.equal(chamadas[0].init.redirect, 'manual');
    } finally { global.fetch = old; }
  }
});

test('v1062: wrangler troca npm:web-push e supabase-js e liga o Worker de dados públicos', () => {
  const conf = JSON.parse(fs.readFileSync('cloudflare/diario-radar/wrangler.jsonc', 'utf8'));
  assert.equal(conf.alias['npm:web-push@3.6.7'], './webpush-v1062.mjs');
  assert.equal(conf.alias['npm:@supabase/supabase-js@2'], '@supabase/supabase-js');
  assert.ok(conf.services.some((s) => s.binding === 'NOTICIAS' && s.service === 'diario-trader'));
  assert.ok(conf.services.some((s) => s.binding === 'SELF' && s.service === 'diario-radar'));
  const prod = fs.readFileSync('cloudflare/diario-radar/producao-v892.mjs', 'utf8');
  assert.match(prod, /funcaoLocalV1062\(request,env,ctx\)/);
});

test('v1062: chamadas ao Worker diario-trader e dados públicos saem pela ligação interna', async () => {
  const { criarFetchV1062 } = await locais();
  const via = [], nativas = [];
  const b = { fetch: async (u, i) => { via.push([String(u), i?.method || 'GET']); return String(u).includes('/v1/macro') ? new Response('{}', { status: 502 }) : Response.json({ ok: true }); } };
  const f = criarFetchV1062(async (u, i) => { nativas.push(String(u)); return new Response('{}', { status: 200 }); }, () => b);
  await f('https://diario-trader.lucianosilva43567.workers.dev/v1/noticias', { method: 'GET' });
  await f(SB + '/functions/v1/adrs', { method: 'POST', body: JSON.stringify({ symbols: ['EWZ'] }) });
  await f(SB + '/functions/v1/macro', { method: 'POST', body: '{}' }); // Cloudflare 502 → origem anterior
  await f(SB + '/rest/v1/push_subs', { method: 'GET' });
  assert.deepEqual(via.map((x) => x[0]), ['https://diario-trader.lucianosilva43567.workers.dev/v1/noticias',
    'https://diario-trader.lucianosilva43567.workers.dev/v1/adrs?s=EWZ', 'https://diario-trader.lucianosilva43567.workers.dev/v1/macro?']);
  assert.deepEqual(nativas, [SB + '/functions/v1/macro', SB + '/rest/v1/push_subs']);
  const semLigacao = criarFetchV1062(async (u) => { nativas.push(String(u)); return new Response('{}'); }, () => null);
  nativas.length = 0; await semLigacao(SB + '/functions/v1/adrs', { method: 'POST', body: '{"symbols":["EWZ"]}' });
  assert.deepEqual(nativas, [SB + '/functions/v1/adrs']);
});
