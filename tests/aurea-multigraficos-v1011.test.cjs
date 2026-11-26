const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
const img='/9j/AA==',other='/9j/AQ==',a=data=>({mime:'image/jpeg',data});
const req=b=>new Request('https://worker.workers.dev/v1/aurea-imagem',{method:'POST',headers:{Origin:'https://meudiariotrade.github.io','Content-Type':'application/json',Authorization:'Bearer dummy'},body:JSON.stringify({pergunta:'Compare VALE3 e PETR4',...b})});
const g=(indice)=>({indice,tipo:'grafico_parcial',ativo:'Não identificado',periodo:'Não identificado',leitura:'A estrutura visível não permite confirmar os pivôs.',pivos:[]});
const result={tipo:'grafico_parcial',resumo:'Tese condicional',tecnico:'Leitura técnica',fundamentalista:'Sem dados',critico:'A tese depende de confirmação',estrutura:{lacuna:'Períodos não confirmados'},comparacao:'As imagens mostram estruturas distintas; não é possível confirmar a correlação.',graficos:[g(2),g(1)]};
const env={GEMINI_API_KEY:'fake',MISTRAL_API_KEY:'fake',SCREENER_CACHE:{get:async()=>null,put:async()=>{}}};
test('cada imagem mantém seu índice; rejeita respostas incompletas ou duplicadas',async()=>{
 const {parecer}=await mod;
 const v=parecer(JSON.stringify(result),null,2);assert.deepEqual(v.graficos.map(x=>x.indice),[1,2]);assert.deepEqual(v.pivos,[]);
 assert.equal(parecer(JSON.stringify({...result,graficos:[g(1),g(1)]}),null,2),null);
 assert.equal(parecer(JSON.stringify({...result,graficos:[g(1)]}),null,2),null);
});
test('Gemini e reserva Mistral recebem os dois JPEGs na mesma consulta',async()=>{
 const {aureaImagem}=await mod,calls=[];
 const r=await aureaImagem(req({imagens:[a(img),a(other)]}),env,{},{auth:async()=>'u',fetcher:async(url,opt)=>{
 const b=JSON.parse(opt.body);calls.push(b);if(url.includes('googleapis')){assert.deepEqual(b.contents[0].parts.filter(x=>x.inlineData).map(x=>x.inlineData.data),[img,other]);return new Response('',{status:503});}
 assert.deepEqual(b.messages[1].content.filter(x=>x.type==='image_url').map(x=>x.image_url),[img,other].map(x=>'data:image/jpeg;base64,'+x));
 return Response.json({choices:[{message:{content:JSON.stringify(result)}}]});}});
 assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);assert.equal((await r.json()).resposta.graficos.length,2);assert.ok(calls.length>=2);
});
test('rejeita excesso, mistura de contratos e JPEG inválido antes da IA; limite conta imagens',async()=>{
 const {aureaImagem}=await mod;const deps={auth:async()=>'u',fetcher:async()=>{throw Error('Não chamar IA')}};
 for(const b of [{imagens:[a(img),a(img),a(img),a(img)]},{imagens:[a(img)],imagem:a(img)},{imagens:[a(img),a('bad')]}])assert.equal((await aureaImagem(req(b),env,{},deps)).status,400);
 assert.equal((await aureaImagem(req({imagens:[a(img),a(other)]}),{...env,SCREENER_CACHE:{get:async()=>13,put:async()=>{throw Error('Não gravar')}}},{},deps)).status,429);
});
test('interface permite seleção múltipla, remoção individual e envio em memória',()=>{
 const ui=fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8'),core=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
 assert.match(ui,/name="photo" accept="image\/\*" multiple/);assert.match(ui,/data-chat-previews/);assert.match(ui,/graficosAureaV1011/);assert.match(core,/imagens:payload/);assert.match(core,/delete m.imagens/);
});