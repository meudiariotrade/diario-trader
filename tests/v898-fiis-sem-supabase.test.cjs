const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const trecho = (src, de, ate) => {
  const i = src.indexOf(de);
  assert.ok(i >= 0, 'Marcador ausente: ' + de);
  const j = src.indexOf(ate, i + de.length);
  assert.ok(j > i, 'Fim ausente: ' + ate);
  return src.slice(i, j);
};
test('v898: FIIs públicos são coletados e distribuídos sem Supabase', () => {
  const worker = read('cloudflare/diario-screeners/index.mjs');
  const fiis = trecho(worker, "if(url.pathname==='/v1/fiis')", "if(url.pathname==='/v1/cvm-provas')");
  assert.match(fiis, /raw\.githubusercontent\.com/);
  assert.doesNotMatch(fiis, /supabase\.co|\/functions\/v1|\/rest\/v1|method:\s*['"]POST/i);
  const script = read('scripts/atualizar-fiis.mjs');
  const workflow = read('.github/workflows/fiis-dados.yml');
  assert.match(script, /fundamentus\.com\.br\/fii_resultado\.php/);
  assert.doesNotMatch(script + workflow, /supabase|edge_logs|postgres_logs|\/functions\/v1/i);
  const d = JSON.parse(read('dados-publicos/fiis.json'));
  assert.equal(d.versao, 1);
  assert.ok(Array.isArray(d.rows) && d.rows.length >= 30);
  assert.equal(new Set(d.rows.map(x => x.ticker)).size, d.rows.length);
});
test('v898: novos botões não invocam a função analise do Supabase', () => {
  const analises = read('src/analysis/analises-plus.js');
  const aurea = read('src/intelligence/etapa1.js');
  const carteira = read('src/portfolio/gestao-rebalanceamento-v694.js');
  const novos = [
    trecho(analises, "if('apFiiConselho' in ds)", "if('apFiitese' in ds)"),
    trecho(aurea, "const antiBtn=event.target.closest('[data-aurea-antitilt]')", "const ouvBtn=event.target.closest('[data-aurea-ouvir]')"),
    trecho(carteira, "const aud=event.target.closest?.('[data-rb694-auditoria]')", "const btn=event.target.closest?.('[data-rb694-munger]')"),
  ];
  for (const s of novos) {
    assert.match(s, /DiarioConselhoIA\(/);
    assert.doesNotMatch(s, /\bvoid\s+ecoPergunta\s*\(|\bawait\s+ecoPergunta\s*\(/);
    assert.doesNotMatch(s, /fetch\s*\(\s*[^)]*\/functions\/v1\/analise/);
  }
  // v904: o Resumão foi restaurado dentro do app, mas segue fora das Edge
  // Functions do Supabase. Apenas a validação de login permanece no Auth.
  const resumo = trecho(aurea, "const resBtn=event.target.closest('[data-aurea-resumao]')", "const revBtn=event.target.closest('[data-aurea-revisao]')");
  assert.match(resumo,/workers\.dev\/v1\/aurea-resumao/);
  assert.match(resumo,/credentials:'omit'/);
  assert.doesNotMatch(resumo,/\/functions\/v1\/analise|\bawait\s+ecoPergunta\s*\(/);
  assert.doesNotMatch(resumo,/Resumão da Áurea copiado/);
});
