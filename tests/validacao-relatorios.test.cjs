const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const url = 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(fs.readFileSync('supabase/functions/analise/validacao.ts', 'utf8'))).toString('base64');
const rel = fato => ({ tecnica: { fatos: [fato] } });
test('decimais ingleses, brasileiros e percentuais mantêm escala e sinal', async () => {
  const { numerosFato } = await import(url);
  assert.deepEqual(numerosFato('0.854; 76.067%; R$ 1.234,56; USD 1,234.56; −15%'), [.854, 76.067, 1234.56, 1234.56, -15]);
});
test('sinal invertido e números inventados não recebem Validado', async () => {
  const { validaRelatorio: v } = await import(url);
  assert.equal(v(rel('A variação foi +15%.'), { variacao: -15 }, []).estado, 'revisar');
  assert.equal(v(rel('A receita é 3 milhões.'), { receita: 300 }, []).estado, 'revisar');
  assert.equal(v(rel('A liquidez é 0.854.'), { liquidez: .854 }, []).estado, 'validado');
  assert.equal(v(rel('A receita é R$ 1,2 bilhão.'), { receita: 1.2e9 }, []).estado, 'validado');
});
test('MM50, RSI14 e faixa de 52 semanas não são valores financeiros', async () => {
  const { validaRelatorio: v } = await import(url);
  assert.equal(v(rel('A cotação está abaixo da MM50 e MM200, na mínima de 52 semanas.'), { preco: 16.97 }, []).estado, 'validado');
  assert.equal(v(rel('O balanço do 3T26 foi divulgado em 11/11/2026, no exercício de 2026.'), {}, []).estado, 'validado');
});
test('texto anterior não é aceito como fonte e lacunas continuam explícitas', async () => {
  const { validaRelatorio: v } = await import(url);
  assert.equal(v(rel('O lucro foi de 99.'), { RELATORIO_ANTERIOR: { fatos: ['99'] } }, []).estado, 'revisar');
  assert.equal(v(rel('A variação é -15%.'), { variacao: -15 }, ['Trimestre pendente']).estado, 'com_limitacoes');
});
test('carteira com muitos dados é conferida por índice sem comparação quadrática', async () => {
  const { validaRelatorio: v } = await import(url);
  const start = performance.now(), dados = Array.from({ length: 50000 }, (_, i) => i + .123);
  const r = v({ fatos: Array.from({ length: 1000 }, (_, i) => `O valor é ${i + .123}.`) }, dados, []);
  assert.equal(r.estado, 'validado'); assert.ok(performance.now() - start < 1500);
});
