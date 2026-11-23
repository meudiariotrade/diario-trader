const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const uid='11111111-1111-4111-8111-111111111111';
const origin='https://meudiariotrade.github.io';
const token='a'.repeat(80);
const modulePromise=import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
const env=()=>({SUPABASE_URL:'https://teste.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_teste',GEMINI_API_KEY:'secret_key_test',SCREENER_CACHE:{state:new Map(),async get(k){return this.state.get(k)||null},async put(k,v){this.state.set(k,v)}}});
function post(o={},body){return new Request('https://screeners.worker.test/v1/aurea-resumao',{method:'POST',headers:{Origin:o.origin||origin,Authorization:o.token===null?'':'Bearer '+(o.token||token),'Content-Type':'application/json'},body:JSON.stringify(body||{edicao:'manha',prompt:'Resumão do mercado financeiro nesta manhã, preparar 4 blocos de análise com dados observados e cenários condicionais. As fontes podem estar atrasadas e não se pode inventar preços.'})});}
test('v904: Resumão da Áurea entrega texto dentro do app, sem PostgREST, usando Gemini na Cloudflare',async()=>{
 const original=global.fetch,requests=[],e=env();
 global.fetch=async(url,init)=>{
  requests.push({url:String(url),init});
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:uid});
  if(String(url).includes('generativelanguage.googleapis.com'))return Response.json({candidates:[{content:{parts:[{text:'1) Futuros EUA: dados atrasados. 2) Brasil: aguardar abertura. 3) Agenda: verificar fontes oficiais. 4) Risco: evitar operar sem confirmação.'}]}}]});
  throw Error('Chamada não permitida');
 };
 try{
  const {resumoAurea}=await modulePromise;
  const response=await resumoAurea(post(),e);
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.ok,true);assert.match(data.text,/Futuros EUA/);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal(requests.filter(x=>x.url.includes('supabase.co')).length,1);
  assert.ok(requests[0].url.endsWith('/auth/v1/user'));
  assert.ok(!requests.some(x=>/\/rest\/v1|\/functions\/v1|\/storage\/v1/.test(x.url)));
  assert.ok(!requests.some(x=>x.url.includes('generativelanguage')&&x.init.headers.Authorization));
 }finally{global.fetch=original;}
});
test('v904: origem não autorizada e ausência de login bloqueadas antes de enviar prompt ao Gemini',async()=>{
 const old=global.fetch;let remote=0;
 global.fetch=async()=>{remote++;return Response.json({}, {status:401})};
 try{
  const {resumoAurea}=await modulePromise,e=env();
  const other=await resumoAurea(post({origin:'https://site-externo.example'}),e);
  assert.equal(other.status,403);assert.equal(remote,0);
  const anon=await resumoAurea(post({token:null}),e);
  assert.equal(anon.status,401);assert.ok(remote<=1);
 }finally{global.fetch=old;}
});
test('v904: limite gratuito e CORS pré-flight são respeitados',async()=>{
 const {resumoAurea}=await modulePromise,e=env(),old=global.fetch;
 global.fetch=async()=>Response.json({id:uid});
 try{
  const day=new Date().toISOString().slice(0,10);
  await e.SCREENER_CACHE.put('aurea:usage:v904:'+uid+':'+day,'14');
  const exceeded=await resumoAurea(post(),e);
  assert.equal(exceeded.status,429);
  const options=await resumoAurea(new Request('https://screeners.worker.test/v1/aurea-resumao',{method:'OPTIONS',headers:{Origin:origin}}),e);
  assert.equal(options.status,204);
  assert.match(options.headers.get('access-control-allow-methods'),/POST/);
 }finally{global.fetch=old;}
});
test('v904: Panorama no iPhone apresenta aviso na imagem se o dado estiver antigo e não abre confirm',()=>{
 const source=fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8');
 const start=source.indexOf('async function imgDados()');
 const stop=source.indexOf('function imgMostra(e)',start);
 assert.ok(start>=0&&stop>start);
 const fn=source.slice(start,stop);
 assert.match(fn,/DADOS PARCIAIS \/ CONSULTA ANTERIOR/);
 assert.match(fn,/Promise\.allSettled/);
 assert.match(fn,/canvas/);
 assert.match(fn,/IMG\.aviso/);
 const generator=fn.slice(fn.indexOf('async function imgGera()'));
 assert.doesNotMatch(generator,/confirm\(|alert\(/);
});
test('v904: Áurea retorna resposta inline, não copia o comando para colar em outra IA',()=>{
 const s=fs.readFileSync('src/intelligence/etapa1.js','utf8');
 const resumo=s.slice(s.indexOf("const resBtn=event.target.closest('[data-aurea-resumao]')"),s.indexOf("const revBtn=event.target.closest('[data-aurea-revisao]')"));
 assert.match(s,/data-aurea-resumo-gerado/);
 assert.match(resumo,/\/v1\/aurea-resumao/);
 assert.match(resumo,/state\.resumaoHtml/);
 assert.doesNotMatch(resumo,/clipboard\??\.writeText|Resumão da Áurea copiado/);
 assert.doesNotMatch(resumo,/\/functions\/v1\/analise/);
});
