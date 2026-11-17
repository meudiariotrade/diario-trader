const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');

const source = fs.readFileSync('supabase/functions/_shared/ai-router.ts', 'utf8');
const principal = "['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free']";
const originalGemini = "['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'";

async function router(identificador) {
  const js = stripTypeScriptTypes(source, { mode: 'transform' });
  return import('data:text/javascript;base64,' +
    Buffer.from(js + '\n// ' + identificador, 'utf8').toString('base64'));
}
const env = (chave) => ({
  OPENROUTER_API_KEY: 'chave-falsa-apenas-testes',
  IA_DESLIGAR: 'gemini,groq,cerebras,mistral,huggingface,deepseek,pollinations',
}[chave]);
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const entry = (id, opts = {}) => ({
  id,
  pricing: { prompt: '0', completion: '0', ...opts.pricing },
  endpoints: opts.endpoints || ['/api/v1/chat/completions'],
  architecture: { output_modalities: ['text'] },
});
const META = 'meta-llama/llama-3.3-70b-instruct:free';
const DEEPSEEK = 'deepseek/deepseek-v4.1-flash:free';
const GLM = 'z-ai/glm-5.3-flash:free';

test('fallback nunca altera a ordem dos Gemini e OpenRouter primários', () => {
  assert.ok(source.includes(originalGemini));
  assert.ok(source.includes(principal));
  const indexOriginal = source.indexOf("const CANDIDATOS_RESERVA");
  assert.ok(indexOriginal > source.indexOf("ok('openrouter'"));
  assert.ok(source.includes("fila.push({\n      id: 'openrouter-reserva'"));
  for (const id of [DEEPSEEK, 'deepseek/deepseek-v4.1-flash-1017:free', GLM,
    'x-ai/grok-4.5:free', 'x-ai/grok-4.7:free', 'xiaomi/mimo-2.6-flash:free']) {
    assert.ok(source.includes(id), 'candidato de reserva ausente: ' + id);
  }
});

test('primário bem-sucedido não chama nenhum modelo da reserva', async () => {
  const api = await router('teste-primario');
  const tentados = [];
  const fetcher = async (url, init) => {
    if (String(url).endsWith('/models')) return json({ data: [entry(META), entry(GLM)] });
    const model = JSON.parse(init.body).model;
    tentados.push(model);
    return json({ choices: [{ message: { content: 'Resposta principal' } }] });
  };
  const out = await api.gerarTexto('sistema', 'teste', {
    env, fetcher, ate: Date.now() + 20000, porTentativaMs: 3000,
  });
  assert.equal(out.provedor, 'OpenRouter');
  assert.deepEqual(tentados, [META]);
});

test('429 no primário passa à reserva sem repetir o mesmo modelo gratuito', async () => {
  const api = await router('teste-429');
  const tentados = [];
  const fetcher = async (url, init) => {
    if (String(url).endsWith('/models')) return json({ data: [entry(META), entry(GLM)] });
    const model = JSON.parse(init.body).model;
    tentados.push(model);
    if (model === META) return json({ error: { message: 'quota exceeded' } }, 429);
    return json({ choices: [{ message: { content: 'Reserva funcionando' } }], model });
  };
  const out = await api.gerarTexto('sistema', 'teste', {
    env, fetcher, ate: Date.now() + 20000, porTentativaMs: 3000,
  });
  assert.equal(out.provedor, 'OpenRouter Reserva');
  assert.equal(out.modelo, GLM);
  assert.deepEqual(tentados, [META, META, GLM]);
});

test('404 do slug reconsulta catálogo e encontra novo modelo de graça', async () => {
  const api = await router('teste-404');
  const tentados = [];
  let consultas = 0;
  const fetcher = async (url, init) => {
    if (String(url).endsWith('/models')) {
      consultas++;
      return json({ data: consultas === 1 ? [entry(META)] :
        consultas === 2 ? [entry(DEEPSEEK), entry(GLM)] : [entry(GLM)] });
    }
    const model = JSON.parse(init.body).model;
    tentados.push(model);
    if (model === META || model === DEEPSEEK)
      return json({ error: { message: 'Model not found' } }, 404);
    return json({ choices: [{ message: { content: 'Modelo atualizado' } }], model });
  };
  const out = await api.gerarTexto('sistema', 'teste', {
    env, fetcher, ate: Date.now() + 20000, porTentativaMs: 3000,
  });
  assert.equal(out.modelo, GLM);
  assert.deepEqual(tentados, [META, DEEPSEEK, GLM]);
  assert.equal(consultas, 3);
});

test('mesmo se anúncio disser :free, modelo pago é barrado pela tabela de preços', async () => {
  const api = await router('teste-precos');
  let chamadas = 0;
  const fetcher = async (url, init) => {
    if (String(url).endsWith('/models')) {
      chamadas++;
      return json({ data: chamadas === 1 ? [entry(META)] : [
        entry('x-ai/grok-4.7:free', { pricing: { prompt: '0.000002' } }),
        entry(GLM),
      ] });
    }
    const model = JSON.parse(init.body).model;
    if (model === 'x-ai/grok-4.7:free') assert.fail('chamada indevida a modelo pago');
    if (model === META) return json({ error: 'Modelo removido' }, 404);
    return json({ choices: [{ message: { content: 'Somente grátis' } }], model });
  };
  const out = await api.gerarTexto('sistema', 'teste', {
    env, fetcher, ate: Date.now() + 20000, porTentativaMs: 3000,
  });
  assert.equal(out.modelo, GLM);
});
