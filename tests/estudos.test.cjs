const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const acorn = require('acorn');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function functions(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8'), result = {};
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') result[node.id.name] = source.slice(node.start, node.end);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(acorn.parse(source, { ecmaVersion: 'latest' }));
  return result;
}
const original = functions('app.js'), bundle = functions('nucleo-v560.js');
const shared = ['estMeta', 'estDefinirMeta', 'estSalva', 'estRegHtml', 'estSessoesDisponiveis', 'estAtualizaSessoes', 'semEstudo', 'estDesemp', 'estSeq', 'estMapa', 'estCicloCalc', 'estHoje', 'estProximasAcoes', 'estConq'];
function context() {
  const logs = [], records = [], revisions = [], messages = [], fields = {};
  for (const [id, value] of Object.entries({ estmat: 'ing', esttipo: 'teoria', esttop: 'Oferta e demanda', estmin: '15', estq: '0', estok: '0', estpag: '0', estnota: 'Anotação', estd: '2026-11-09', esttempo: 'manual' })) fields[id] = { value };
  const ctx = {
    Date, Math, Object, String, Number, Set, Map, S: { ax: {} }, EST: {}, EST_REV: [1, 7, 30], FOCO_MAT: [['ing', 'Inglês']],
    document: { getElementById: id => fields[id] },
    enHoje: () => '2026-11-09', segundaDe: () => '2026-11-09',
    diasMais: (day, count) => { const date = new Date(day + 'T12:00Z'); date.setUTCDate(date.getUTCDate() + count); return date.toISOString().slice(0, 10); },
    focoLog: () => logs, estReg: () => records, estRev: () => revisions, estMat: key => key === 'ing' ? { n: 'Inglês', foco: 'ing' } : null,
    estMin: (start, end) => logs.filter(item => item.d >= start && item.d <= end), estNome: item => item.n || 'Inglês',
    estCiclo: () => ({}), estMats: () => [], enS: () => ({ min: {}, xp: {} }), cnS: () => ({ r: {} }), plL: () => [],
    sum: list => list.reduce((a, b) => a + b, 0), save() {}, render() {}, scrollTo() {}, toast: text => messages.push(text),
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'estudos-modelo.js'), 'utf8'), ctx);
  vm.runInContext(shared.filter(name => name !== 'estRegHtml').map(name => original[name]).join('\n'), ctx);
  return { ctx, logs, records, revisions, fields, messages };
}

test('o runtime e o fonte usam exatamente as mesmas regras de Estudos', () => {
  for (const name of shared) assert.equal(bundle[name], original[name], name);
});
test('vincular uma sessão mantém 15 minutos, salva notas e agenda revisões sem duplicar tempo', () => {
  const { ctx, logs, fields, records, revisions } = context();
  logs.push({ d: '2026-11-09', mat: 'ing', min: 15 });
  fields.esttempo.value = '0'; ctx.estSalva();
  assert.equal(ctx.semEstudo().tot, 15);
  assert.equal(logs.length, 1);
  assert.equal(records.length, 1);
  assert.equal(logs[0].reg, records[0].id);
  assert.equal(records[0].nota, 'Anotação');
  assert.deepEqual(Array.from(revisions, r => r.d), ['2026-11-10', '2026-11-16', '2026-12-09']);
  ctx.estSalva();
  assert.equal(records.length, 1, 'Uma sessão não pode ser vinculada duas vezes.');
});
test('duas sessões manuais distintas continuam somando tempo', () => {
  const { ctx, logs, records } = context();
  ctx.estSalva(); ctx.estSalva();
  assert.equal(logs.length, 2);
  assert.equal(records.length, 2);
  assert.equal(ctx.semEstudo().tot, 30);
});
test('vínculo exige a mesma data, matéria e duração e preserva a sessão quando rejeitado', () => {
  const { ctx, logs, fields, records } = context();
  logs.push({ d: '2026-11-09', mat: 'ing', min: 25 });
  fields.esttempo.value = '0'; ctx.estSalva();
  assert.equal(records.length, 0);
  assert.equal(logs[0].reg, undefined);
  fields.estmin.value = '25'; fields.estmat.value = 'outra'; ctx.estSalva();
  assert.equal(records.length, 0);
  fields.estmat.value = 'ing'; ctx.estSalva();
  assert.equal(records.length, 1);
  assert.equal(ctx.semEstudo().tot, 25);
});
test('datas futuras, datas impossíveis e acertos acima do total não salvam registros', () => {
  const { ctx, fields, records } = context();
  fields.estd.value = '2026-11-10'; ctx.estSalva();
  fields.estd.value = '2026-02-30'; ctx.estSalva();
  fields.estd.value = '2026-11-09'; fields.estq.value = '5'; fields.estok.value = '6'; ctx.estSalva();
  assert.equal(records.length, 0);
});
test('registros futuros antigos ficam preservados, mas não contam como realização', () => {
  const { ctx, logs, records } = context();
  logs.push({ d: '2026-11-09', mat: 'ing', min: 15 }, { d: '2026-11-10', mat: 'ing', min: 60 });
  records.push({ d: '2026-11-10', n: 'Inglês', mat: 'ing', tipo: 'aula', pag: 10, q: 10, ok: 10, top: 'Futuro' });
  assert.equal(ctx.semEstudo().tot, 15);
  assert.equal(ctx.estDesemp(7).aulas, 0);
  assert.equal(ctx.estDesemp(7).pag, 0);
  assert.equal(ctx.estMapa().fac.length, 0);
  assert.equal(ctx.estSeq().n, 1);
  assert.equal(logs.length, 2);
  assert.equal(records.length, 1);
});
test('minutos e XP futuros de Inglês não entram na semana nem no desempenho atual', () => {
  const { ctx } = context();
  ctx.enS = () => ({ min: { '2026-11-09': 10, '2026-11-10': 50 }, xp: { '2026-11-09': 5, '2026-11-10': 20 } });
  assert.equal(ctx.semEstudo().tot, 10);
  assert.equal(ctx.semEstudo().mats.ing, 10);
  assert.equal(ctx.semEstudo().xp, 5);
  assert.equal(ctx.estDesemp(7).min, 10);
});
test('uma meta validada é compartilhada e valores inválidos não substituem a escolha anterior', () => {
  const { ctx } = context();
  assert.equal(ctx.estMeta().definida, false);
  assert.equal(ctx.estDefinirMeta('300'), true);
  assert.equal(ctx.S.ax.focoMeta, 300);
  assert.equal(ctx.estMeta().min, 300);
  for (const invalid of ['', '-1', '0', '29', '30.5', '6001', 'Infinity']) assert.equal(ctx.estDefinirMeta(invalid), false);
  assert.equal(ctx.estMeta().min, 300);
});
