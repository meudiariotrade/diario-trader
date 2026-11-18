'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {withApp}=require('./helpers/app.cjs');
const html=fs.readFileSync('src/index.html','utf8');
const service=fs.readFileSync('src/service-worker.js','utf8');
test('PDF Pesquisa iPhone: módulo carregado na página antes dos botões da aba Análises',()=>{
 const pdf=html.indexOf('src="pesquisa-pdf.js?v=__APP_VERSION__"');
 assert.ok(pdf>=0,'Pesquisa PDF precisa ter entrada no documento');
 assert.ok(html.indexOf('src="tecnico-pdf.js?v=__APP_VERSION__"')<pdf,'Entregador PDF iOS deve iniciar antes');
 assert.ok(pdf<html.indexOf('src="analises.js?v=__APP_VERSION__"'),'Botão da pesquisa só pode usar API inicializada');
 assert.match(service,/CORE=\[[^;]*"pesquisa-pdf.js"/,'Cache da versão deve ser atômico');
 const release=JSON.parse(fs.readFileSync('release.config.json','utf8'));
 assert.equal(release.bundles['pesquisa-pdf.js'],'src/analysis/pesquisa-pdf.js');
 assert.ok(release.version>=766,'correção do módulo Pesquisa deve permanecer após a v766');
});
test('PDF Pesquisa iPhone: biblioteca registrada e geração local produz PDF válido',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto(base+'/?demo=1');
 await page.locator('#splash').waitFor({state:'hidden'});
 const result=await page.evaluate(async()=>{
  if(typeof window.DiarioPesquisaPDF?.share!=='function')return {missing:true};
  if(typeof window.DiarioPDFiOS?.deliver!=='function')return {missingDelivery:true};
  const pdf=await window.DiarioPesquisaPDF.build({
   id:'cvm-sec-teste',resultado:{texto:'# Pesquisa técnica\nDados sob revisão. Sem recomendações de investimento.',
   consultado_em:'2026-11-18',fontes:[{titulo:'CVM',url:'https://dados.cvm.gov.br'}]}
  });
  return {pages:pdf.pages,bytes:pdf.blob.size,prefix:await pdf.blob.slice(0,8).text()};
 });
 assert.equal(result.missing,undefined);
 assert.equal(result.missingDelivery,undefined);
 assert.ok(result.pages>=1);
 assert.ok(result.bytes>2000);
 assert.match(result.prefix,/%PDF-/);
 await page.close();
}));
test('PDF técnico e Top10 continuam com travas de comprovação e mesmos modelos',()=>{
 const ui=fs.readFileSync('src/analysis/tecnico-ui.js','utf8');
 const top=fs.readFileSync('src/analysis/screeners-top10.js','utf8');
 assert.match(ui,/Encontrados /);
 assert.match(ui,/rows\.length!==10/);
 assert.match(ui,/avisoPdfInsuficiente/);
 assert.match(ui,/plan\.rr>=1\.5/);
 assert.match(top,/d\.validated/);
 const pdfs=['src/analysis/pesquisa-pdf.js','src/analysis/tecnico-pdf.js','src/analysis/screeners-relatorio.js'];
 for(const file of pdfs)new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
});
