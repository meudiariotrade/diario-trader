'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(fs.readFileSync(path,'utf8'),{mode:'transform'})).toString('base64'));
const rows=()=>{const out=[];let day=new Date(Date.now()-420*86400000);while(day.getTime()<Date.now()-86400000){if(day.getUTCDay()>0&&day.getUTCDay()<6)out.push([Math.floor(day.getTime()/1000),100,110,90,105,1000]);day=new Date(day.getTime()+86400000)}return out};
test('Livermore EUA usa Cloudflare, valida OHLCV, agrega semanas e não certifica ajuste exploratório',async()=>{
 const d=await load('supabase/functions/pesquisa/dados.ts'),r=rows(),calls=[];
 const got=await d.candlesLivermoreEUA('ABBV',async u=>{calls.push(String(u));return String(u).includes('workers.dev')?Response.json({ok:true,ticker:'ABBV',market:'US',tf:'1d',source:'Yahoo',candles:r,adjustedCandles:r}):new Response('',{status:503})});
 assert.equal(calls.length,3);assert.match(calls[0],/ticker=ABBV/);assert.equal(got.diario.length,r.length);assert.ok(got.semanal.length>=40);assert.equal(got._meta.diario.ajustado,false);
 assert.equal(d.validarCandlesEdge([...r.slice(0,-1),[r.at(-1)[0],100,90,80,105,1000]]),false);
 assert.equal(d.validarCandlesEdge(r.slice(0,100)),false);
});
test('se ticker do Worker diverge, não usa a série de outro ativo',async()=>{
 const d=await load('supabase/functions/pesquisa/dados.ts'),r=rows();
 const got=await d.candlesLivermoreEUA('ABBV',async u=>String(u).includes('workers.dev')?Response.json({ok:true,ticker:'AAPL',market:'US',tf:'1d',candles:r,adjustedCandles:r}):new Response('',{status:503}));
 assert.equal(got.diario.length,0);
});
test('roteador aceita lista atual isolada sem alterar os outros consumidores',async()=>{
 const api=await load('supabase/functions/_shared/ai-router.ts'),calls=[];
 const env=k=>({GEMINI_API_KEY:'teste',IA_DESLIGAR:'groq,cerebras,openrouter,mistral,huggingface,deepseek,pollinations'})[k];
 assert.equal(api.provedores(env)[0].modelos[0],'gemini-2.5-flash');
 const out=await api.gerarTexto('sistema','prompt',{env,geminiModelos:['gemini-3.8-flash','gemini-3.5-flash-lite'],fetcher:async u=>{calls.push(String(u));return Response.json({candidates:[{content:{parts:[{text:'ok'}]}}]})}});
 assert.match(calls[0],/gemini-3\.8-flash/);assert.equal(out.texto,'ok');
});
