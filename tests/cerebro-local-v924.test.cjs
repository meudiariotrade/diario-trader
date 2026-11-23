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

test('briefing de Graham busca pelo conceito e envia o mercado como contexto separado',async()=>{
 const doc={addEventListener(){},querySelector:()=>null,getElementById:()=>null};
 let prompt;
 const ctx={document:doc,indexedDB,crypto:webcrypto,AbortController,Date,console,TextEncoder,TextDecoder,
  SESS:{uid:'teste-briefing',at:'teste'},tok:async()=>{},fetch:async(url,init)=>{
   prompt=JSON.parse(init.body).prompt;
   return Response.json({ok:true,text:JSON.stringify({resultado:{resposta:'Leitura'}})});
  }};
 ctx.window=ctx;vm.runInNewContext(fs.readFileSync('src/ai/cerebro-ia.js','utf8'),ctx);
 const brain=ctx.DiarioCerebroIA,txt='A margem de segurança compara preço e valor e protege contra erros de estimativa. '.repeat(5);
 await brain.importar({name:'Investidor.txt',size:txt.length,text:async()=>txt},{autor:'Benjamin Graham',categoria:'Investimentos'});
 await brain.api({acao:'gerar',modo:'briefing',tema:'Graham margem de segurança',extra:'PETR4 com margem em revisão'});
 assert.match(prompt,/livros explicam os critérios/);
 assert.match(prompt,/"extra":"PETR4/);
 assert.match(prompt,/"obra":"Investidor"/);
});
