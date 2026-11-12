const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
test('handler autenticado entrega cache com aviso quando a IA responde 503',async()=>{
 let handler,calls=0;
 const now=new Date(),dia=now.toISOString().slice(0,10),salva={versao:'mesa-v562',dia,gerado:new Date(Date.now()-3600000).toISOString(),capa:{manchete:'Edição salva'}};
 const env={SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'fixture',SUPABASE_ANON_KEY:'fixture',GEMINI_API_KEY:'fixture'};
 const c={Response,Request,AbortSignal,URL,Date,console:{error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>handler=fn},fetch:async(input)=>{
   const u=String(input);if(u.includes('/auth/v1/user'))return Response.json({id:'usuario'});
   if(u.includes('generativelanguage')){calls++;return Response.json({error:{message:'503 indisponível'}},{status:503})}
   if(u.includes('scanner.tradingview'))return Response.json({data:[]});
   if(u.includes('chave=eq.mesa'))return Response.json([{dia,criado:salva.gerado,dados:salva}]);
   if(u.includes('analise_cache'))return Response.json([{dia,chave:'jornal:'+dia+':manha',dados:{manchete:{titulo:'Fonte'},cotacoes:[]}}]);
   throw Error('Pedido inesperado: '+u);
 }};
 vm.createContext(c);
 const helper=fs.readFileSync('supabase/functions/mesa/fallback.ts','utf8').replace(/export /g,'');
 const body=fs.readFileSync('supabase/functions/mesa/index.ts','utf8').replace(/import \{ edicaoSalva \} from '.\/fallback.ts';/,'');
 vm.runInContext(stripTypeScriptTypes(helper+'\n'+body,{mode:'transform'}),c);
 const response=await handler(new Request('https://fn.test/mesa',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({force:true})}));
 const value=await response.json();assert.equal(response.status,200);assert.equal(value.desatualizado,true);assert.equal(value.gerado,salva.gerado);assert.ok(calls>0);
 const denied=await handler(new Request('https://fn.test/mesa',{method:'POST',body:'{}'}));assert.equal(denied.status,401);
});
