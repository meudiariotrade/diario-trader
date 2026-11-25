const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {generateKeyPairSync,sign}=require('node:crypto');
const uid='11111111-1111-4111-8111-111111111111';
const origin='https://meudiariotrade.github.io';
const authOrigin='https://teste.supabase.co';
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk={...publicKey.export({format:'jwk'}),alg:'ES256',kid:'v904-test-key',use:'sig'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const payload={iss:authOrigin+'/auth/v1',aud:'authenticated',role:'authenticated',sub:uid,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)};
const msg=enc({typ:'JWT',alg:'ES256',kid:jwk.kid})+'.'+enc(payload);
const token=msg+'.'+sign('sha256',Buffer.from(msg),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
const modulePromise=import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs');
const env=()=>({SUPABASE_URL:authOrigin,SUPABASE_ANON_KEY:'sb_publishable_teste',GEMINI_API_KEY:'secret_key_test',SCREENER_CACHE:{state:new Map(),async get(k){return this.state.get(k)||null},async put(k,v){this.state.set(k,v)}}});
function post(o={},body){return new Request('https://screeners.worker.test/v1/aurea-resumao',{method:'POST',headers:{Origin:o.origin||origin,Authorization:o.token===null?'':'Bearer '+(o.token||token),'Content-Type':'application/json'},body:JSON.stringify(body||{edicao:'manha',prompt:'Resumão do mercado financeiro nesta manhã, preparar 4 blocos de análise com dados observados e cenários condicionais. As fontes podem estar atrasadas e não se pode inventar preços.'})});}
test('v904: Resumão da Áurea entrega texto dentro do app, sem PostgREST, usando Gemini na Cloudflare',async()=>{
 const original=global.fetch,requests=[],e=env();
 global.fetch=async(url,init)=>{
  requests.push({url:String(url),init});
  if(String(url).endsWith('/auth/v1/.well-known/jwks.json'))return Response.json({keys:[jwk]});
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
  assert.ok(requests[0].url.endsWith('/auth/v1/.well-known/jwks.json'));
  assert.equal(requests[0].init.redirect,'manual');
  assert.ok(!requests.some(x=>x.url.endsWith('/auth/v1/user')));
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
 global.fetch=async(url)=>String(url).endsWith('/auth/v1/.well-known/jwks.json')?Response.json({keys:[jwk]}):Response.json({id:uid});
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
 const start=s.indexOf("const resBtn=event.target.closest("),end=s.indexOf("const revBtn=event.target.closest('[data-aurea-revisao]')",start);
 assert.ok(start>=0&&end>start,'handler da Áurea presente');
 const resumo=s.slice(start,end);
 assert.match(resumo,/data-aurea-resumao/);
 assert.match(resumo,/data-dt978-ia="brief30"/);
 assert.match(resumo,/shortBrief/);
 assert.match(resumo,/exatamente 3 tópicos/);
 assert.match(s,/data-aurea-resumo-gerado/);
 assert.match(resumo,/\/v1\/aurea-resumao/);
 assert.match(resumo,/state\.resumaoHtml/);
 assert.doesNotMatch(resumo,/clipboard\??\.writeText|Resumão da Áurea copiado/);
 assert.doesNotMatch(resumo,/\/functions\/v1\/analise/);
});
test('Conselho usa a instrução da especialidade e devolve o parecer para cada botão', async () => {
 const {resumoAurea}=await modulePromise;
 const old=global.fetch;
 try {
  for(const [edicao,especialidade] of [['etfs','Markowitz'],['fiis','Graham'],['antitilt','três perguntas'],['carteira','concentração']]){
   const prompt='Considere os indicadores e as limitações fornecidas para esta consulta do Conselho no app.';
   const resposta='Resposta de teste do Conselho para validar a entrega da análise solicitada.';
   global.fetch=async(url,init)=>{
    if(String(url).endsWith('/auth/v1/.well-known/jwks.json'))return Response.json({keys:[jwk]});
    assert.equal(init.redirect,'manual','A chamada ao Gemini deve usar redirecionamento manual no Worker');
    const payload=JSON.parse(init.body);
    assert.ok(payload.systemInstruction.parts[0].text.includes(especialidade));
    assert.equal(payload.contents[0].parts[0].text,prompt);
    return Response.json({candidates:[{content:{parts:[{text:resposta}]}}]});
   };
   const res=await resumoAurea(post({}, {edicao,prompt}),env());
   assert.equal(res.status,200);
   assert.equal((await res.json()).text,resposta);
  }
 } finally {global.fetch=old;}
});

test('Cérebro usa Groq configurado quando Gemini devolve JSON de estudo inválido',async t=>{
 const {resumoAurea}=await modulePromise;
 const resultado={resultado:{resposta:'Aplique o critério do livro aos dados atuais de PETR4.'}};
 const hosts=[];
 t.mock.method(global,'fetch',async(url,init)=>{
  const host=new URL(url).hostname;
  if(host==='teste.supabase.co')return Response.json({keys:[jwk]});
  hosts.push(host);
  if(host==='generativelanguage.googleapis.com')return Response.json({candidates:[{content:{parts:[{text:'{}'}]}}]});
  assert.equal(host,'api.groq.com');
  assert.equal(init.redirect,'manual');
  return Response.json({choices:[{message:{content:JSON.stringify(resultado)}}]});
 });
 const res=await resumoAurea(post({},{edicao:'estudos',prompt:'Modo briefing. Aplique a margem de segurança descrita nos trechos de Graham aos dados de PETR4 no campo extra.'}),{...env(),GROQ_API_KEY:'chave-teste'});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.match(body.model,/Groq/);
 assert.deepEqual(JSON.parse(body.text),resultado);
 assert.equal(hosts[0],'generativelanguage.googleapis.com');
});

test('Conselho da Áurea mantém dados privados fora de IA anônima e usa Workers AI',async t=>{
 const {resumoAurea}=await modulePromise;
 const hosts=[],texto='Resposta suficientemente longa e didática, baseada apenas nos dados fornecidos pelo usuário. O mercado exige prudência com a gestão de risco.';
 t.mock.method(global,'fetch',async(url,init)=>{
  const host=new URL(url).hostname;
  if(host==='teste.supabase.co')return Response.json({keys:[jwk]});
  hosts.push(host);
  if(host==='api.groq.com')assert.equal(JSON.parse(init.body).model,'openai/gpt-oss-20b');
  if(host==='text.pollinations.ai')throw Error('Proibido enviar dados privados para IA anônima');
  return Response.json({},{status:429});
 });
 const res=await resumoAurea(post(),{...env(),GROQ_API_KEY:'teste',
  AI:{async run(model,args){assert.match(model,/llama/);return {response:texto}}}
 });
 assert.equal(res.status,200);
 assert.ok(hosts.includes('api.groq.com'));
 assert.equal(hosts.includes('text.pollinations.ai'),false);
 assert.match((await res.json()).model,/Cloudflare Workers AI/);
});

test('v988: Briefing usa o handler textual da Áurea e não a ficha genérica do Conselho',()=>{
 const layer=fs.readFileSync('src/domains/layers/03-apresentacao.js','utf8');
 const a=layer.indexOf('const ia978 ='),b=layer.indexOf('const capa978 =',a);
 assert.ok(a>=0&&b>a);
 const h=layer.slice(a,b);
 assert.ok(h.indexOf('if(k==="brief30")return;')>=0&&h.indexOf('if(k==="brief30")return;')<h.indexOf('window.DiarioConselhoIA('));
 const src=fs.readFileSync('src/intelligence/etapa1.js','utf8');
 assert.match(src,/data-dt978-ia="brief30"/);
 assert.match(src,/state\.resumaoHtml/);
});
