const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=(path)=>fs.readFileSync(path,'utf8');
const app=read('src/analysis/analises.js');
const sync=read('supabase/functions/screeners-sync/index.ts');
const query=read('supabase/functions/screeners-quant/index.ts');
const css=read('analises.css');
test('Análises mantém a Pesquisa e acrescenta dois Screeners sem outra aba',()=>{
  new vm.Script(app);
  assert.match(app,/ANALISE PETR4/);
  assert.match(app,/COMPARE PETR4 PBR/);
  assert.match(app,/screenTab='pesquisa'/);
  assert.match(app,/Screener Brasil/);
  assert.match(app,/Screener EUA/);
  assert.match(app,/DiarioAnalises\.command/);
});
test('Screeners consultam a Carteira sem lançar trades ou alterar S.cart',()=>{
  assert.match(app,/w\.pfCalc\(\)/);
  assert.match(app,/\.peso/);
  assert.match(app,/data-scr-add/);
  assert.match(app,/irPara\('carteiras'\)/);
  assert.doesNotMatch(app,/S\.cart\.lanc\.(?:push|splice)/);
});
test('Consulta autenticada e paginação não expõem chave service role',()=>{
  assert.match(query,/auth\/v1\/user/);
  assert.match(query,/quant_screeners_buscar/);
  assert.match(query,/p_page/);
  assert.doesNotMatch(app,/SERVICE_ROLE_KEY|BRAPI_TOKEN/);
});
test('Sincronização sem polling e limitada por lotes',()=>{
  assert.match(sync,/quant_screeners_lote/);
  assert.match(sync,/200/);
  assert.match(sync,/diario_agendamento_chave/);
  assert.doesNotMatch(sync,/setInterval|Realtime\.channel|subscribe\(/);
});
test('Estética profissional compacta somente nas sub-abas',()=>{
  assert.match(css,/\.an-subs/);
  assert.match(css,/#d4a017/i);
  assert.match(css,/#11141b/i);
  assert.match(css,/\.scr-table/);
  assert.match(css,/@media\(max-width:480px\)/);
});
test('Versão principal deve ser incrementada',()=>{
 const release=JSON.parse(read('release.config.json'));
 assert.ok(release.version>=742);
});