const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const load=p=>fs.readFileSync(p,'utf8');
const src=load('src/analysis/fibo-visual.js');
const window={};
const document={addEventListener:()=>{}};
vm.runInNewContext(src,{window,document,indexedDB:{}},{filename:'fibo-visual.js'});
const calc=window.DiarioFiboVisual.calculate;
test('Fibonaccing compra calcula todos os níveis, expansão, stop e R/R sem usar IA para contas',()=>{
 const r=calc({ancora_0:100,ancora_100:200,direcao:'Compra / Alta',preco_atual:170,niveis_visiveis:[{percentual:61.8,preco:161.8}]});
 assert.equal(r.levels.length,15);assert.equal(r.plan.entry,200);assert.equal(r.plan.stop,176.4);
 assert.equal(r.plan.targets[0],211);assert.ok(Math.abs(r.plan.rr[0]-11/23.6)<1e-10);
 assert.equal(r.zone,'Zona de mitigação');
});
test('Fibonaccing venda espelha direção e alvos',()=>{
 const r=calc({ancora_0:200,ancora_100:100,direcao:'Venda / Baixa',niveis_visiveis:[]});
 assert.equal(r.plan.entry,100);assert.equal(r.plan.stop,123.6);assert.equal(r.plan.targets[0],89);
});
test('Bloqueio de alucinações nas âncoras, direção e níveis visíveis',()=>{
 assert.throws(()=>calc({ancora_0:null,ancora_100:100,direcao:'Compra / Alta'}),/Âncoras/);
 assert.throws(()=>calc({ancora_0:200,ancora_100:100,direcao:'Compra / Alta'}),/contradizem/);
 assert.throws(()=>calc({ancora_0:100,ancora_100:200,direcao:'Compra / Alta',niveis_visiveis:[{percentual:61.8,preco:195}]}),/divergem/);
});
test('Três telas, PDF local e RLS sem armazenamento bruto no Supabase',()=>{
 const ui=load('src/analysis/tecnico-ui.js'),an=load('src/analysis/analises.js');
 const research=load('src/analysis/pesquisa-pdf.js'),tec=load('src/analysis/tecnico-pdf.js');
 const mig=load('supabase/migrations/20261119200000_conhecimento_trading_v805.sql');
 const edge=load('supabase/functions/conhecimento-ia/index.ts');
 for(const key of ['br','world'])assert.match(ui,/DiarioFiboVisual\?\.view\(m\)/);
 assert.match(an,/DiarioFiboVisual\?\.view\('pesquisa'\)/);
 assert.match(research,/DiarioFiboVisual\?\.appendPDF/);assert.match(tec,/DiarioFiboVisual\?\.appendPDF/);
 assert.match(mig,/enable row level security/);assert.match(mig,/owner_id=\(select auth\.uid\(\)\)/);
 assert.match(edge,/Auth|auth\/v1\/user/i);
 assert.doesNotMatch(edge,/storage\/v1|storage\.from\(/i);
 assert.match(load('src/ai/cerebro-ia.js'),/pdfjs-dist@6\.2\.108/);
});
