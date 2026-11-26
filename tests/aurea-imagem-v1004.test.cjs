const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
const image='/9j/AA==',question='Analise VALE3: acho que está rompendo resistência.';
const req=(b={pergunta:question,imagem:{mime:'image/jpeg',data:image}},origin='https://meudiariotrade.github.io')=>new Request('https://worker.workers.dev/v1/aurea-imagem',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer dummy'},body:JSON.stringify(b)});
const result={tipo:'grafico',resumo:'A tese precisa de confirmação.',tecnico:'A região de resistência mostra rejeição; o fundo recente ainda precisa de rompimento do topo para confirmar reação. Volume deve ser conferido.',fundamentalista:'Conferir margem de segurança.',critico:'Avaliar invalidação.',observar:['Volume'],estrutura:{periodo:'Diário',tendencia:'Reação em estrutura de baixa',evidencias:['Topo anterior acima da resistência','Fundo recente ainda não confirmado'],principal:'Continuação da correção se romper suporte',alternativo:'Recuperação se superar resistência',confirmacao:'Fechamento abaixo do fundo observado',invalidacao:'Retomada do topo anterior com fechamento'},pivos:[{tipo:'topo',estado:'confirmado',x:.42,y:.25,preco:'~65,00',motivo:'Rompimento subsequente do fundo anterior'},{tipo:'fundo',estado:'potencial',x:.6,y:.72,preco:'58,12',motivo:'Reação sem romper o topo anterior'}]};
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

test('v1007: rejeita resposta genérica e coordenadas inválidas sem inventar pivôs',async()=>{
 const {parecer,normalizarPivosV1007}=await mod;
 assert.equal(parecer(JSON.stringify({resumo:'Olhe o gráfico',tecnico:'Observe volume',fundamentalista:'Confira dados',critico:'Cuidado'}),null),null);
 assert.equal(parecer(JSON.stringify({...result,pivos:[{tipo:'topo',estado:'confirmado',x:2,y:.2,motivo:'fora da imagem original'}]}),null),null);
 const good=parecer(JSON.stringify(result),null);assert.equal(good.pivos.length,2);assert.equal(good.pivos[1].estado,'potencial');assert.match(good.estrutura.invalidacao,/topo/);
 assert.deepEqual(normalizarPivosV1007([{tipo:'fundo',estado:'potencial',x:'0.5',y:.2,motivo:'Coordenada do modelo inválida'}]),[]);
 const partial=parecer(JSON.stringify({...result,tipo:'grafico_parcial',pivos:[],estrutura:{lacuna:'Não é possível distinguir os pavios'}}),null);assert.deepEqual(partial.pivos,[]);
});
test('v1007: sete especialidades mantêm método próprio, com Dow como mentor',async()=>{
 const {metodoConselhoV1007}=await import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
 const casos={graham:'ROIC',helmer:'barreira',livermore:'pivôs',munger:'inversão',markowitz:'concentração',schwartz:'agenda',dalio:'dívida',dow:'conceito'};
 for(const [id,termo] of Object.entries(casos))assert.ok(metodoConselhoV1007(id,'').includes(termo),id);
 assert.match(metodoConselhoV1007('ativo','ATIVO TÉCNICO: PRIO3'),/pivôs/);
});

test('v1010: trechos conceituais não interferem na identificação do ticker nem nos pivôs',async()=>{
 const {aureaImagem}=await mod;
 let snapshotCalled=0;
 const r=await aureaImagem(req({pergunta:question,imagem:{mime:'image/jpeg',data:image},biblioteca:[{obra:'Teste',trecho:'PETR4 é exemplo de livro. '+ 'conceito '.repeat(100)},{obra:'Outro',trecho:'Volume e tendência'},{obra:'Excedente',trecho:'Não enviar'}]}),env(),{},{
 auth:async()=>'u',snapshot:async()=>{snapshotCalled++;return new Response('',{status:503})},
 fetcher:async(url,opts)=>{const p=JSON.parse(opts.body).contents[0].parts[0].text;assert.match(p,/dados não confiáveis/);assert.match(p,/PETR4 é exemplo/);assert.doesNotMatch(p,/Excedente/);return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]})}
 });assert.equal(r.status,200);assert.equal(snapshotCalled,1);assert.equal((await r.json()).resposta.pivos.length,2);
});

test('v1019 gráfico técnico simples não carrega protocolos de commodities, opções e valuation sem pertinência',async()=>{
 const {aureaImagem}=await mod;
 const r=await aureaImagem(req({pergunta:'Interprete o cenário técnico de Ibovespa',imagem:{mime:'image/jpeg',data:image}}),env(),{},{auth:async()=>'u',fetcher:async(url,opt)=>{
 const instruction=JSON.parse(opt.body).systemInstruction.parts[0].text;
 assert.doesNotMatch(instruction,/OPEP|Trava de alta com calls|DCF somente/);assert.match(instruction,/grafico_parcial/);
 return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]});
 }});
 assert.equal(r.status,200);
});
