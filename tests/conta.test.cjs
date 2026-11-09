const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripTypeScriptTypes } = require('node:module');
const directory = path.join(__dirname, '../supabase/functions/conta');
const asModule = source => 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64');
const storageURL = asModule(fs.readFileSync(path.join(directory, 'storage.ts'), 'utf8'));
const uid = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });

function fakeStorage(initial, options = {}) {
  const files = new Set(initial), calls = [];
  let failed = false;
  return { files, calls, client: { url: 'https://storage.invalid', headers: {}, deadline: Date.now() + 60_000,
    fetch: async (input, init) => {
      const url = new URL(input), body = JSON.parse(init.body);
      calls.push({ method: init.method, path: url.pathname, ...body });
      if (options.fail && !failed && init.method === options.fail) { failed = true; return json({}, 503); }
      if (init.method === 'DELETE') {
        assert.ok(body.prefixes.length <= 1000);
        assert.ok(body.prefixes.every(name => name.startsWith(uid + '/')));
        for (const name of body.prefixes) if (!options.ignoreDelete) files.delete(name);
        return json([]);
      }
      const entries = new Map();
      for (const file of [...files].sort()) if (file.startsWith(body.prefix)) {
        const rest = file.slice(body.prefix.length), slash = rest.indexOf('/');
        if (slash === -1) entries.set(rest, { name: rest, id: file, metadata: {} });
        else entries.set(rest.slice(0, slash), { name: rest.slice(0, slash), id: null, metadata: null });
      }
      return json([...entries.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(body.offset, body.offset + body.limit));
    },
  }};
}

test('cobre os oito buckets, subpastas e paginação sem tocar em outro usuário', async () => {
  const { apagaArquivos, BUCKETS } = await import(storageURL);
  assert.equal(BUCKETS.length, 8);
  const own = Array.from({ length: 2101 }, (_, n) => `${uid}/arquivo-${String(n).padStart(4, '0')}.json`);
  own.push(`${uid}/aula/capitulo/figura.png`, `${uid}/aula/audio.wav`);
  const storage = fakeStorage([...own, `${other}/nao-apagar.json`]);
  assert.equal(await apagaArquivos('backups', uid, storage.client), own.length);
  assert.deepEqual([...storage.files], [`${other}/nao-apagar.json`]);
  const pages = storage.calls.filter(c => c.path.includes('/list/') && c.prefix === uid + '/');
  assert.ok(pages.some(c => c.offset === 2000));
  const firstDelete = storage.calls.findIndex(c => c.method === 'DELETE');
  assert.ok(storage.calls.findIndex(c => c.offset === 2000) < firstDelete);
});

for (const method of ['POST', 'DELETE']) test(`falha em ${method} interrompe e permite retomar`, async () => {
  const { apagaArquivos } = await import(storageURL);
  const storage = fakeStorage([`${uid}/a.json`, `${uid}/pasta/b.json`], { fail: method });
  await assert.rejects(apagaArquivos('backups', uid, storage.client), /503/);
  await apagaArquivos('backups', uid, storage.client);
  assert.equal(storage.files.size, 0);
  assert.equal(await apagaArquivos('backups', uid, storage.client), 0);
});

test('resposta de exclusão sem remoção efetiva nunca informa sucesso', async () => {
  const { apagaArquivos } = await import(storageURL);
  const storage = fakeStorage([`${uid}/a.json`], { ignoreDelete: true });
  await assert.rejects(apagaArquivos('backups', uid, storage.client), /Ainda há arquivos/);
});

test('rejeita usuário, bucket e caminhos inválidos; falha por tempo não apaga arquivos', async () => {
  const { apagaArquivos } = await import(storageURL);
  const storage = fakeStorage([`${uid}/a.json`]);
  await assert.rejects(apagaArquivos('backups', '../outro', storage.client), /inválido/);
  await assert.rejects(apagaArquivos('outro-bucket', uid, storage.client), /inválido/);
  await assert.rejects(apagaArquivos('backups', uid, { ...storage.client, deadline: 0 }), /pendente/);
  await assert.rejects(apagaArquivos('backups', uid, { ...storage.client, fetch: async () => json([{ name: '..', id: 'x' }]) }), /Caminho inválido/);
  assert.equal(storage.calls.length, 0);
});

test('handler exige login e senha e só apaga o login depois de limpar todos os buckets', async () => {
  const originalFetch = global.fetch, originalDeno = global.Deno;
  let handler, wrongPassword = false, failList = false;
  const calls = [];
  const env = { SUPABASE_URL: 'https://conta.invalid', SUPABASE_ANON_KEY: 'fake-anon', SUPABASE_SERVICE_ROLE_KEY: 'fake-service' };
  global.Deno = { env: { get: key => env[key] }, serve: fn => { handler = fn; } };
  global.fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method });
    if (url.endsWith('/auth/v1/user')) return json({ id: uid, email: 'teste@example.invalid' });
    if (url.includes('grant_type=password')) return wrongPassword ? json({}, 400) : json({ user: { id: uid } });
    if (url.includes('/object/list/')) return failList ? json({}, 503) : json([]);
    return json({});
  };
  try {
    const source = fs.readFileSync(path.join(directory, 'index.ts'), 'utf8').replace("'./storage.ts'", JSON.stringify(storageURL));
    const module = await import(asModule(source));
    assert.ok(module.TABELAS.some(([table]) => table === 'aulas_audio_jobs'));
    assert.ok(module.TABELAS.some(([table]) => table === 'aulas_imagens_jobs'));
    assert.ok(module.TABELAS.some(([table]) => table === 'aulas_teste'));
    const request = (token = 'user.token.test') => new Request('https://conta.invalid/functions/v1/conta', {
      method: 'POST', headers: { authorization: token ? 'Bearer ' + token : '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'excluir', confirma: 'EXCLUIR', senha: 'fake-password' }),
    });
    assert.equal((await handler(request(''))).status, 401);
    wrongPassword = true;
    assert.equal((await handler(request())).status, 403);
    assert.equal(calls.filter(c => c.method === 'DELETE').length, 0);
    wrongPassword = false; failList = true;
    assert.equal((await handler(request())).status, 500);
    assert.equal(calls.filter(c => c.method === 'DELETE').length, 0);
    failList = false; calls.length = 0;
    const response = await handler(request());
    assert.equal(response.status, 200);
    const { BUCKETS } = await import(storageURL);
    for (const bucket of BUCKETS) assert.ok(calls.some(c => c.url.endsWith('/object/list/' + bucket)));
    assert.ok(calls.at(-1).url.endsWith('/auth/v1/admin/users/' + uid));
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.ok(calls.filter(c => c.method === 'DELETE' && c.url.includes('/rest/')).every(c => c.url.endsWith('eq.' + uid)));
  } finally { global.fetch = originalFetch; global.Deno = originalDeno; }
});
