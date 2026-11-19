'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function extrator(pdfjs){
 const src=fs.readFileSync('src/ai/cerebro-ia.js','utf8');
 const a=src.indexOf(' async function extractPDF(file){'),b=src.indexOf(' const invalidUrl=',a);
 assert.ok(a>=0&&b>a,'Extrator da biblioteca deve estar presente');
 const code=src.slice(a,b).replace(
  "await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.mjs')",
  'await loadPDFJS()');
 assert.match(code,/await loadingTask\.destroy\(\)/);
 assert.doesNotMatch(code,/doc\.destroy\(/);
 return vm.runInNewContext(code+';extractPDF',{loadPDFJS:async()=>pdfjs,Uint8Array,Math,status(){}});
}
const arquivo={arrayBuffer:async()=>new Uint8Array([37,80,68,70,45]).buffer};

test('v806: PDF.js v6 extrai páginas mesmo quando o documento não tem destroy()',async()=>{
 let destroyed=0;
 const document={numPages:2,getPage:async i=>({getTextContent:async()=>({items:[{str:'Página'},{str:String(i)}]})})};
 const getDocument=()=>({promise:Promise.resolve(document),destroy:async()=>{destroyed++}});
 const text=await extrator({GlobalWorkerOptions:{},getDocument})(arquivo);
 assert.equal(text,'Página 1\n\nPágina 2');
 assert.equal(destroyed,1,'Limpeza pertence ao loading task');
});

test('v806: erro de leitura de página não impede liberação de worker',async()=>{
 let destroyed=0;
 const document={numPages:1,getPage:async()=>({getTextContent:async()=>{throw Error('Falha de leitura')}})};
 const getDocument=()=>({promise:Promise.resolve(document),destroy:async()=>{destroyed++}});
 await assert.rejects(extrator({GlobalWorkerOptions:{},getDocument})(arquivo),/Falha de leitura/);
 assert.equal(destroyed,1);
});

test('v806: falha ao abrir PDF também finaliza loading task',async()=>{
 let destroyed=0;
 const getDocument=()=>({promise:Promise.reject(Error('PDF inválido')),destroy:async()=>{destroyed++}});
 await assert.rejects(extrator({GlobalWorkerOptions:{},getDocument})(arquivo),/PDF inválido/);
 assert.equal(destroyed,1);
});
