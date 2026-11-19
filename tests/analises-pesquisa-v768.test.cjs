'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const read=p=>fs.readFileSync(p,'utf8');
test('Pesquisa gera três gráficos verificados e mantém páginas de falta de prova',()=>{
 const pdf=read('src/analysis/pesquisa-pdf.js');
 for(const k of ['trend','fibo','elliott'])assert.match(pdf,new RegExp("'"+k+"'"));
 assert.match(pdf,/function candlesConferidos/);
 assert.match(pdf,/raw\.length<289/);
 assert.match(pdf,/asset\?\.ajustado/);
 assert.match(pdf,/graficoPDF\(chart,kind\)/);
 assert.match(pdf,/MM20\/50\/200/);
 assert.match(pdf,/OBV/);
 assert.match(pdf,/Exp /);
 assert.match(pdf,/pivotsConfirmados/);
 assert.match(pdf,/GRÁFICOS NÃO DISPONÍVEIS/);
 new vm.Script(pdf);
});
test('Todos os PDFs trazem SHA-256 do snapshot e versão do método',()=>{
 for(const file of ['src/analysis/pesquisa-pdf.js','src/analysis/tecnico-pdf.js','src/analysis/screeners-relatorio.js']){
  const s=read(file);new vm.Script(s,{filename:file});
  assert.match(s,/hashSnapshot/);
  assert.match(s,/SHA-256/);
  const versao=file.includes('screeners-relatorio.js')?/app v798|v798/:/app v768|v768/;
  assert.match(s,versao);
 }
});
test('Pesquisa tem ajuste Yahoo adjclose auditável e validador de claims sem números ignorados',()=>{
 const candles=read('supabase/functions/pesquisa/dados.ts');
 const motor=read('supabase/functions/pesquisa/motor.ts');
 assert.match(candles,/events=div%2Csplits/);
 assert.match(candles,/adjclose/);
 assert.match(candles,/ajustado:adjusted/);
 assert.match(candles,/Lacuna temporal de candles sem comprovação/);
 assert.match(motor,/hist\.length>=289&&meta\.ajustado===true/);
 const s=motor.slice(motor.indexOf('function numero('),motor.indexOf('/** Etapa 3:')).replace(/export /g,'');
 const f=vm.runInNewContext(stripTypeScriptTypes(s,{mode:'transform'})+'\nvalidarNumerosIA',{Math,Number,String,Set});
 assert.equal(f('A ação subiu 3%','Retorno 3,0%').ok,true);
 assert.equal(f('O ROE é 3%','ROE 6,0%').ok,false,'3% não pode ser isento por ser número pequeno');
 assert.equal(f('Preço-alvo de 200','Preço de 100').ok,false);
 assert.equal(f('1. Resultados: 15%','15%').ok,true,'Numeração do título não é claim');
});
test('Backfill continua regulado e documentos carregam URLs específicas sem inventar métricas',()=>{
 const sql=read('supabase/migrations/20261118175100_analises_proveniencia_cadencia_v768.sql');
 const sync=read('supabase/functions/screeners-sync/index.ts');
 assert.match(sql,/url_referencia/);
 assert.match(sql,/data_competencia_balanco/);
 assert.match(sql,/screeners-sec-documentos-v768-intermediario/);
 assert.match(sql,/screeners-sec-documentos-v768-encerramento/);
 assert.match(sync,/const SEC_UA='DiarioTraderQuant\/1\.0 \(contato@diariotrader\.app\)'/);
 assert.match(sync,/wait\(Math\.max\(0,180-/);
});
