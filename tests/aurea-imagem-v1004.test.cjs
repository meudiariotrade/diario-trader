const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
const image='/9j/AA==',question='Analise VALE3: acho que está rompendo resistência.';
const req=(b={pergunta:question,imagem:{mime:'image/jpeg',data:image}},origin='https://meudiariotrade.github.io')=>new Request('https://worker.workers.dev/v1/aurea-imagem',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer dummy'},body:JSON.stringify(b)});
const result={resumo:'A tese precisa de confirmação.',tecnico:'Observar estrutura e volume.',fundamentalista:'Conferir margem de segurança.',critico:'Avaliar invalidação.',observar:['Volume']};
const env=()=>({GEMINI_API_KEY:'fake',MISTRAL_API_KEY:'fake',SCREENER_CACHE:{get:async()=>null,put:async()=>{}}});
test('nega origem, autenticação e imagens inválidas antes do provedor',async()=>{
 const {aureaImagem}=await mod;let calls=0;const deps={auth:async()=>null,fetcher:async()=>{calls++;throw Error('não chamar')}};
 assert.equal((await aureaImagem(req(undefined,'https://evil.example'),env(),{},deps)).status,403);
 assert.equal((await aureaImagem(req(),env(),{},deps)).status,401);
 assert.equal((await aureaImagem(req({pergunta:question,imagem:{mime:'image/svg+xml',data:image}}),env(),{},{...deps,auth:async()=>'u'})).status,400);
 assert.equal(calls,0);
});
test('Gemini recebe pixels e Mistral é reserva visual; pareceres sem dados fundamentais inventados',async()=>{
 const {aureaImagem}=await mod,calls=[];
 const r=await aureaImagem(req(),env(),{},{
  auth:async()=>'u',snapshot:async()=>new Response('',{status:503}),
  fetcher:async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body)});if(url.includes('googleapis'))return new Response('',{status:503});
    return Response.json({choices:[{message:{content:JSON.stringify(result)}}]})}
 });
 assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private, no-store/);
 const j=await r.json();assert.equal(j.resposta.visoes.length,3);assert.match(j.resposta.visoes[1].argumento,/Sem fundamentos públicos/);
 assert.equal(calls[0].body.contents[0].parts[1].inlineData.data,image);
 assert.equal(calls.at(-1).body.messages[1].content[1].image_url,'data:image/jpeg;base64,'+image);
 assert.match(j.modelo,/Mistral/);
});
test('fundamentos somente de ticker explícito e snapshot público; mantém lacunas',async()=>{
 const {aureaImagem,tickerExplicito}=await mod;
 assert.deepEqual(tickerExplicito('VALE3'),{ticker:'VALE3',market:'BR'});assert.equal(tickerExplicito('VALE3 PETR4'),null);
 const r=await aureaImagem(req(),env(),{},{auth:async()=>'u',snapshot:async()=>Response.json({market:'BR',universe_complete:true,last_update:new Date().toISOString(),universe_rows:[{ticker:'VALE3',roe:12,roic:9,pl:null,user_id:'omit'}]}),fetcher:async(url,opts)=>{
  const s=JSON.parse(opts.body).contents[0].parts[0].text;assert.ok(s.includes('"roe":12'));assert.ok(!s.includes('user_id'));return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]});
 }});
 assert.equal(r.status,200);const j=await r.json();assert.ok(j.resposta.fatos.includes('roe: 12'));assert.equal(j.resposta.visoes[1].argumento,result.fundamentalista);
});
test('chat efêmero: armazenamento antigo removido, fechamento invalida e cancela pedidos',()=>{
 const core=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),layer=fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8');
 const a=core.slice(core.indexOf('const ECO = {'),core.indexOf('/* v883'));
 assert.match(a,/l: \[\]/);assert.match(a,/ls\.del\("diario-eco"\)/);assert.doesNotMatch(a,/ls\.set/);assert.match(a,/ECO\.geracao\+\+/);assert.match(a,/ECO\.controller\?\.abort/);
 assert.match(layer,/if\(estava\)\{G="";limparChat\(\);\}/);
 assert.match(layer,/geracao!==ECO\.geracao/);assert.match(layer,/data-chat-photo/);assert.match(layer,/visualViewport\?\.addEventListener/);
});

test('v1005: falhas reais dos provedores externos acionam Gemma multimodal, sem modelo textual',async()=>{
 const {aureaImagem}=await mod,calls=[];
 const e={...env(),AI:{run:async(model,body)=>{calls.push({model,body});return {choices:[{message:{content:JSON.stringify({...result,observar:'Acompanhar volume'})}}]}}}};
 const r=await aureaImagem(req(),e,{},{auth:async()=>'u',snapshot:async()=>new Response('',{status:503}),fetcher:async(url)=>new Response('',{status:url.includes('googleapis')?503:429})});
 assert.equal(r.status,200);const j=await r.json();assert.equal(calls.length,1);assert.equal(calls[0].model,'@cf/google/gemma-4-26b-a4b-it');
 assert.equal(calls[0].body.messages[1].content[1].image_url.url,'data:image/jpeg;base64,'+image);
 assert.equal(calls[0].body.response_format.type,'json_object');assert.match(j.modelo,/Gemma 4/);assert.equal(j.resposta.visoes.length,3);assert.deepEqual(j.resposta.o_que_observar,['Acompanhar volume']);
});
test('v1005: esgotamento dos modelos retorna diagnóstico limitado, não inventa análise nem vaza resposta do provedor',async()=>{
 const {aureaImagem}=await mod,e={...env(),AI:{run:async()=>{throw Error('secret never expose')}}};
 const r=await aureaImagem(req(),e,{},{auth:async()=>'u',snapshot:async()=>new Response('',{status:503}),fetcher:async()=>new Response('secret never expose',{status:429})});
 assert.equal(r.status,503);const j=await r.json();assert.ok(j.diagnostico.some(s=>s.includes('HTTP 429')));assert.ok(j.diagnostico.some(s=>s.includes('Gemma 4')));assert.ok(!JSON.stringify(j).includes('secret'));assert.equal(j.resposta,undefined);
});
