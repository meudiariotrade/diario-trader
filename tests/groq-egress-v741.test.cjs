const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const src=fs.readFileSync('supabase/functions/_shared/ai-router.ts','utf8');
async function loader(tag) {
 const js=stripTypeScriptTypes(src,{mode:'transform'});
 return import('data:text/javascript;base64,'+Buffer.from(js+'\n// '+tag).toString('base64'));
}
test('Groq é primeiro fallback textual do Jornal, Gemini não é repetido',async()=>{
 const api=await loader('groq-primeiro');
 const called=[];
 const env=k=>({GEMINI_API_KEY:'fake-gemini',GROQ_API_KEY:'fake-groq',
   IA_DESLIGAR:'openrouter,cerebras,mistral,huggingface,deepseek,pollinations'}[k]);
 const fetcher=async(url,opts)=>{
   called.push(String(url));
   if(String(url).endsWith('/models'))return new Response(JSON.stringify({data:[{id:'llama-3.3-70b-versatile'}]}),{status:200});
   assert.match(String(url),/api.groq.com/);
   assert.match(String(opts.headers.Authorization),/^Bearer fake-groq$/);
   return new Response(JSON.stringify({model:'llama-3.3-70b-versatile',choices:[{message:{content:'{"ok":true}'}}]}),{status:200});
 };
 const out=await api.gerarTexto('Jornal','Notícias fornecidas',{
   env,fetcher,preferir:['groq'],excluir:['gemini'],json:true,
   porTentativaMs:3000,ate:Date.now()+15000});
 assert.equal(out.provedor,'Groq');
 assert.equal(out.modelo,'llama-3.3-70b-versatile');
 assert.equal(called.some(x=>x.includes('generativelanguage.googleapis.com')),false);
});
test('Sem chave Groq o Jornal pode recorrer às reservas antigas, sem API Groq fictícia',async()=>{
 const api=await loader('groq-ausente');
 const env=k=>({IA_DESLIGAR:'gemini,openrouter,cerebras,mistral,huggingface,deepseek,groq'}[k]);
 const reqs=[];
 const fetcher=async(url,opts)=>{
   reqs.push(String(url));
   return new Response(JSON.stringify({choices:[{message:{content:'Fallback de texto'}}]}),{status:200});
 };
 const out=await api.gerarTexto('Jornal','Somente os dados do app',{
   env,fetcher,preferir:['groq'],excluir:['gemini'],ate:Date.now()+14000,porTentativaMs:3000});
 assert.equal(out.provedor,'Pollinations');
 assert.equal(reqs.some(x=>x.includes('api.groq.com')),false);
});
test('Jornal preserva Gemini principal e diagnósticos não revelam chave',()=>{
 const a=fs.readFileSync('supabase/functions/analise/index.ts','utf8');
 assert.match(a,/await geminiG\(system, parts, principal\)/);
 assert.match(a,/preferir:\['groq'\], excluir:\['gemini'\]/);
 assert.match(a,/if \(!doCron\) return out\(\{erro:'Não autorizado'\},401\)/);
 assert.match(a,/groqConfigurado:!!Deno\.env\.get\('GROQ_API_KEY'\)/);
});
test('Mesa Macro tem cache e não chama API sem JWT',()=>{
 const s=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
 assert.match(s,/const intervalo = M606\.v \? 5 \* 60e3 : 3 \* 60e3/);
 assert.match(s,/typeof SESS === "undefined" \|\| !SESS\?\.at/);
 assert.match(s,/\/functions\/v1\/mesa-macro/);
});
