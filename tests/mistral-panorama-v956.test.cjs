const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const load=()=>import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
const text='Resposta editorial suficientemente longa para confirmar a análise de mercado com dados fornecidos, sem inventar números.';
const prompt='Analise os dados de mercado informados, com cenários condicionais e cautela com fontes atrasadas.';
test('v956: Gemini 3.6 primeiro; Mistral opcional como reserva',async t=>{
 const {generate}=await load(),calls=[];
 t.mock.method(global,'fetch',async(url,init)=>{
  calls.push(String(url));
  if(String(url).includes('googleapis.com'))return Response.json({}, {status:429});
  assert.equal(new URL(url).hostname,'api.mistral.ai');
  assert.equal(init.headers.Authorization,'Bearer teste-mistral');assert.equal(init.redirect,'manual');
  assert.equal(JSON.parse(init.body).model,'mistral-small-latest');
  return Response.json({model:'mistral-small-latest',choices:[{message:{content:text}}]});
 });
 const r=await generate({GEMINI_API_KEY:'teste-gemini',MISTRAL_API_KEY:'teste-mistral'},prompt,'manha');
 assert.match(calls[0],/gemini-3\.6-flash:generateContent/);assert.match(r.model,/Mistral/);assert.equal(r.text,text);assert.ok(calls.every(x=>!x.includes('teste-mistral')));
});
test('v956: Mistral principal por configuração, e falha volta ao Gemini',async t=>{
 const {generate}=await load(),calls=[];let fail=false;
 t.mock.method(global,'fetch',async(url,init)=>{
  calls.push(String(url));
  if(String(url).includes('mistral.ai'))return fail?Response.json({}, {status:429}):Response.json({choices:[{message:{content:text}}]});
  return Response.json({candidates:[{content:{parts:[{text}]}}]});
 });
 const env={AI_PRIMARY:'mistral',MISTRAL_API_KEY:'teste',GEMINI_API_KEY:'teste'};
 assert.match((await generate(env,prompt,'manha')).model,/Mistral/);assert.equal(calls.length,1);
 fail=true;calls.length=0;assert.match((await generate(env,prompt,'manha')).model,/gemini-3\.6-flash/);
 assert.match(calls[0],/mistral.ai/);assert.match(calls[1],/gemini-3\.6-flash/);
});
test('v956: sem chave Mistral não chama o provedor e mantém Workers AI',async t=>{
 const {generate}=await load();t.mock.method(global,'fetch',async()=>{throw Error('nenhuma chamada externa esperada')});
 const r=await generate({AI_PRIMARY:'mistral',AI:{run:async()=>({response:text})}},prompt,'manha');assert.match(r.model,/Cloudflare Workers AI/);
});
test('v956: Resumão inclui EWZ, paridade da cesta de ADRs e cripto',()=>{
 const s=fs.readFileSync('src/intelligence/etapa1.js','utf8');
 const a=s.indexOf('function resumoParidadeAdrs()'),b=s.indexOf('function pulsoDoisMercados()',a);
 assert.ok(a>=0&&b>a);
 const regras=[{s:'PBR',tk:'PETR4',on:'PETR3',razao:2,peso:12},{s:'VALE',tk:'VALE3',razao:1,peso:11.5},{s:'ITUB',tk:'ITUB4',razao:1,peso:7.5},{s:'BBD',tk:'BBDC4',razao:1,peso:3.5},{s:'ABEV',tk:'ABEV3',razao:1,peso:2.8}];
 const ctx={ADR_REGRAS:regras,cotacaoApp:tk=>({USDBRL:{px:5,d1:1},IBOV:{px:160000},PETR3:{px:40},PETR4:{px:36},VALE3:{px:50},ITUB4:{px:30},BBDC4:{px:10},ABEV3:{px:15}}[tk]),state:{mercado:{adrs:[{s:'PBR',px:16,chp:1},{s:'VALE',px:10,chp:1},{s:'ITUB',px:6,chp:1},{s:'BBD',px:2,chp:1},{s:'ABEV',px:3,chp:1}],mercados:{grupos:[{itens:[{n:'EWZ',d1:2,px:30}]}]}}}};
 vm.runInNewContext(s.slice(a,b),ctx);const out=ctx.resumoParidadeAdrs();assert.match(out,/Ibovespa teórico/);assert.match(out,/EWZ: \+2,00%/);assert.match(out,/\+3,02% em R\$/);for(const r of regras)assert.ok(out.includes(r.s+'→'+r.tk));
 assert.match(s,/Termômetro externo de Brasil/);assert.match(s,/pickLive\('BTC'/);assert.match(s,/pickLive\('ETH'/);assert.match(s,/b3Fechada/);
});

test('v956: dia real e sessão prevalecem sobre edição manual; terça não é domingo',()=>{
 const s=fs.readFileSync('src/intelligence/etapa1.js','utf8');const i=s.indexOf('function contextoResumao956('),j=s.indexOf('function resumoParidadeAdrs()',i);const ctx={};vm.runInNewContext(s.slice(i,j),ctx);
 const ter=new Date('2026-11-24T10:52:00Z'),dom=new Date('2026-11-22T22:00:00Z');
 assert.equal(ctx.contextoResumao956({b3:{state:'pre'}},ter).domingo,false);assert.equal(ctx.contextoResumao956({b3:{state:'pre'}},ter).b3Fechada,true);assert.equal(ctx.contextoResumao956({b3:{state:'regular'}},ter).b3Fechada,false);assert.equal(ctx.contextoResumao956({b3:{state:'fechado'}},dom).domingo,true);
 assert.doesNotMatch(s,/ed==='fimdesemana'\?' e cuidado com liquidez baixa de domingo/);
});
