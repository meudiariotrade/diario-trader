const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {indexedDB}=require('fake-indexeddb');
const {webcrypto}=require('node:crypto');
test('v924: importar TXT e buscar trechos de Economia sem enviar conteúdo para a rede',async()=>{
 const src=fs.readFileSync('src/ai/cerebro-ia.js','utf8'),calls=[];
 const doc={addEventListener(){},querySelector:()=>null,getElementById:()=>null};
 const ctx={window:null,document:doc,indexedDB,crypto:webcrypto,AbortController,Request,Response,
  fetch:async(...args)=>{calls.push(args);throw Error('Rede indevida')},console,Date,Promise,TextEncoder,TextDecoder};
 ctx.window=ctx;vm.runInNewContext(src,ctx);
 const brain=ctx.DiarioCerebroIA;
 assert.match(brain.view(),/<option value="Economia">Economia<\/option>/);
 const txt='Política monetária e taxa de juros influenciam inflação, atividade econômica e emprego. '.repeat(10);
 await brain.importar({name:'Economia.txt',size:txt.length,text:async()=>txt},{autor:'Ray Dalio',categoria:'Economia'});
 const hit=await brain.api({acao:'buscar',consulta:'política monetária inflação'});
 assert.ok(hit.trechos.length>=1);
 assert.ok(hit.trechos.some(t=>t.titulo_obra==='Economia'));
 const cov=await brain.api({acao:'cobertura'});
 assert.ok(cov.categorias.Economia>0);
 assert.equal(calls.length,0,'Nenhum trecho deve sair do navegador na importação ou busca');
});
test('v924: sem indexação do Supabase e com aviso de retenção local',()=>{
 const src=fs.readFileSync('src/ai/cerebro-ia.js','utf8');
 assert.doesNotMatch(src,/\/functions\/v1\/conhecimento-ia/);
 assert.doesNotMatch(src,/Indexar.*trechos no Supabase\?/);
 assert.match(src,/Nada será enviado ao Supabase/);
 assert.match(src,/edicao:'estudos'/);
});
