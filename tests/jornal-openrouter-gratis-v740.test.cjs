const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync('supabase/functions/_shared/ai-router.ts','utf8');
async function router(tag){
 const code=stripTypeScriptTypes(source,{mode:'transform'});
 return import('data:text/javascript;base64,'+Buffer.from(code+'\n// '+tag).toString('base64'));
}
const env=k=>({
 OPENROUTER_API_KEY:'chave-falsa-de-testes',
 IA_DESLIGAR:'gemini,groq,cerebras,mistral,huggingface,deepseek,pollinations'
}[k]);
const model=(id,prompt='0',completion='0')=>({
 id,context_length:262144,pricing:{prompt,completion},endpoints:['/api/v1/chat/completions'],
 architecture:{output_modalities:['text']}
});
const asJson=(value,status=200)=>new Response(JSON.stringify(value),{
 status,headers:{'Content-Type':'application/json'}});
test('Jornal prioriza o Grok apenas quando a variante :free é confirmada com custo zero',async()=>{
 const api=await router('grok-verificado');
 const pedidos=[];
 const catalog=[model('x-ai/grok-4.7','0.000002','0.000006'),
   model('x-ai/grok-4.7:free'),model('nvidia/nemotron-3.5-lightning:free')];
 const fetcher=async(url,init)=>{
   if(String(url).endsWith('/models'))return asJson({data:catalog});
   const id=JSON.parse(init.body).model;pedidos.push(id);
   assert.notEqual(id,'x-ai/grok-4.7','não utilizar Grok pago');
   return asJson({model:id,choices:[{message:{content:'Reserva válida'}}]});
 };
 const out=await api.gerarTexto('Jornal econômico','Fatos recebidos',{
   env,fetcher,preferir:['openrouter-reserva'],ate:Date.now()+20000,porTentativaMs:3000});
 assert.equal(out.provedor,'OpenRouter Reserva');
 assert.equal(out.modelo,'x-ai/grok-4.7:free');
 assert.deepEqual(pedidos,['x-ai/grok-4.7:free']);
});
test('Sem Grok grátis, usa Nemotron ou Gemma gratuitos sem cobrar',async()=>{
 const api=await router('sem-grok-gratis');
 const catalog=[model('x-ai/grok-4.5','0.000002','0.000006'),
   model('z-ai/glm-5.3-flash','0.00000015','0.0000005'),
   model('nvidia/nemotron-3.5-lightning:free'),model('google/gemma-4-31b-it:free')];
 const pedidos=[];
 const fetcher=async(url,init)=>{
   if(String(url).endsWith('/models'))return asJson({data:catalog});
   const id=JSON.parse(init.body).model;pedidos.push(id);
   return asJson({model:id,choices:[{message:{content:'Fallback público'}}]});
 };
 const out=await api.gerarTexto('Jornal','Teste',{
   env,fetcher,preferir:['openrouter-reserva'],ate:Date.now()+20000,porTentativaMs:3000});
 assert.equal(out.modelo,'nvidia/nemotron-3.5-lightning:free');
 assert.deepEqual(pedidos,['nvidia/nemotron-3.5-lightning:free']);
});
test('Sem catálogo ao vivo, não presume gratuidade de IDs antigos',async()=>{
 const api=await router('catalogo-fora');
 const tentados=[];
 const fetcher=async(url,init)=>{
   if(String(url).endsWith('/models'))return asJson({erro:'offline'},503);
   const id=JSON.parse(init.body).model;tentados.push(id);
   return asJson({model:id,choices:[{message:{content:'Alternativa existente'}}]});
 };
 await api.gerarTexto('Jornal','Teste',{
   env,fetcher,preferir:['openrouter-reserva'],ate:Date.now()+18000,porTentativaMs:3000});
 assert.equal(tentados.some(x=>/grok-4\.5|grok-4\.7|glm-5\.3-flash/.test(x)),false);
});
test('Rotas de análise conservam Gemini principal e metadados da reserva',()=>{
 const a=fs.readFileSync('supabase/functions/analise/index.ts','utf8');
 assert.match(a,/await geminiG\(system, parts, principal\)/);
 assert.match(a,/preferir:\['openrouter-reserva'\]/);
 assert.match(a,/__fontes_busca:\[\]/);
 assert.match(a,/sem_pesquisa_web:true/);
 assert.match(a,/openrouterConfigurado:!!Deno.env.get\('OPENROUTER_API_KEY'\)/);
});
