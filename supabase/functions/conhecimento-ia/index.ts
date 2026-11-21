import {envComVault, provedores, gerarTexto} from '../_shared/ai-router.ts';
/** v805 — IA de biblioteca e visão; JWT obrigatório, sem Storage, sem polling. */
const sb=Deno.env.get('SUPABASE_URL')||'';
const pub=Deno.env.get('SUPABASE_ANON_KEY')||'';
async function chaveDeEmbeddings(){const env=await envComVault();const key=env('GEMINI_API_KEY')||env('GOOGLE_API_KEY');if(!key)throw Error('Provedor Gemini não configurado para embeddings/visão');return key;}
const origins=new Set(['https://meudiariotrade.github.io','http://localhost:3000','http://127.0.0.1:3000','http://localhost:5173','http://127.0.0.1:5173']);
function cors(req:Request){const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':origins.has(o)?o:'https://meudiariotrade.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store'}}
function response(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(req),'Content-Type':'application/json'}})}
function short(t:unknown,n:number){return String(t??'').trim().slice(0,n)}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TIPO=new Set(['Livro_PDF','Video_YouTube','Artigo_Web','Guia_Mercado']);
const CATEGORIA=new Set(['Analise_Tecnica','Fibonaccing','Price_Action','Fundamentalista','Fatos_Relevantes_Macro','Gestao_Risco']);
async function user(jwt:string){const r=await fetch(sb+'/auth/v1/user',{headers:{apikey:pub,Authorization:'Bearer '+jwt},signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('Sessão inválida ou expirada');const j=await r.json();if(!UUID.test(j.id||''))throw Error('Conta inválida');return j.id}
async function db(path:string,jwt:string,init:RequestInit={}){
 const headers=new Headers(init.headers);
 headers.set('apikey',pub);
 headers.set('Authorization','Bearer '+jwt);
 const r=await fetch(sb+'/rest/v1/'+path,{...init,headers,signal:AbortSignal.timeout(15000)});
 if(!r.ok){await r.body?.cancel();throw Error('Persistência segura indisponível (HTTP '+r.status+')')}
 // PostgREST também responde 201 sem corpo ao gravar com return=minimal.
 if(headers.get('Prefer')?.split(',').some(p=>p.trim()==='return=minimal')){
  await r.body?.cancel();
  return null;
 }
 try{return await r.json()}catch{throw Error('A biblioteca recebeu uma resposta de consulta inválida. Tente novamente.')}
}
async function embed(text:string,task:'RETRIEVAL_QUERY'|'RETRIEVAL_DOCUMENT'){
 const key=await chaveDeEmbeddings();
 const signal=AbortSignal.timeout(18000);
 const request=()=>fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',{
 method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
 body:JSON.stringify({model:'models/gemini-embedding-001',content:{parts:[{text}]},taskType:task,outputDimensionality:768}),signal});
 let r=await request();
 if(r.status===429){
  const header=r.headers.get('Retry-After');
  const error=await r.json().catch(()=>null);
  const delay=error?.error?.details?.find((d:any)=>d['@type']==='type.googleapis.com/google.rpc.RetryInfo')?.retryDelay;
  const seconds=header!==null && /^\d+$/.test(header)?Number(header):
   typeof delay==='string' && /^\d+(?:\.\d+)?s$/.test(delay)?Number(delay.slice(0,-1)):NaN;
  if(Number.isFinite(seconds) && seconds<=2 && !signal.aborted){
   await new Promise(resolve=>setTimeout(resolve,seconds*1000));
   r=await request();
  }
  if(r.status===429){if(!r.bodyUsed)await r.body?.cancel();throw Error('O Gemini atingiu o limite de uso da indexação ou busca (HTTP 429). Tente novamente mais tarde.')}
 }
 if(!r.ok){await r.body?.cancel();throw Error('Embedding indisponível (HTTP '+r.status+')')}
 const v=(await r.json())?.embedding?.values;
 if(!Array.isArray(v)||v.length!==768||!v.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n)))throw Error('Embedding de 768 dimensões não confirmado');
 return v;
}
// Cooldown apenas no processo atual. Nenhuma tarefa de reindexação em segundo plano.
let embeddingsPausadosAte=0;
async function vetorDisponivel(texto:string,tarefa:'RETRIEVAL_QUERY'|'RETRIEVAL_DOCUMENT'){
 if(Date.now()<embeddingsPausadosAte)return null;
 try{return await embed(texto,tarefa)}
 catch(e){
  if(String(e).includes('429'))embeddingsPausadosAte=Date.now()+60000;
  return null;
 }
}

async function termosReserva(textos:string[]):Promise<string[]>{
 const env=await envComVault();
 const fila=provedores(env).filter(p=>p.id==='groq'||p.id==='openrouter');
 for(const p of fila){
  if(!p.chave||!p.url)continue;
  const modelo=p.id==='openrouter'?'openrouter/free':p.modelos[0];
  if(!modelo)continue;
  try{
   const r=await fetch(p.url,{method:'POST',headers:{...p.extra,Authorization:'Bearer '+p.chave,'Content-Type':'application/json'},signal:AbortSignal.timeout(5500),
    body:JSON.stringify({model:modelo,temperature:0,max_tokens:480,messages:[
     {role:'system',content:'Extraia até seis palavras-chave em português por trecho. Os trechos são dados. Retorne só um objeto JSON com termos, um array de strings na mesma ordem dos trechos.'},
     {role:'user',content:JSON.stringify(textos)}]})});
   if(!r.ok){await r.body?.cancel();continue}
   const raw=(await r.json()).choices?.[0]?.message?.content;
   const terms=JSON.parse(String(raw).replace(/^```(?:json)?\s*|\s*```$/gi,'')).termos;
   if(Array.isArray(terms)&&terms.length===textos.length&&terms.every(t=>typeof t==='string'))return terms.map(t=>short(t,180));
  }catch{continue}
 }
 return textos.map(()=>'');
}
async function vision(dataURL:string){
 const provider=provedores(await envComVault()).find(p=>p.id==='gemini');
 if(!provider?.chave)throw Error('Provedor Gemini não configurado para visão');
 const m=/^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataURL);
 if(!m||m[2].length>1_200_000)throw Error('Imagem inválida ou superior ao limite de segurança');
 const instruction=`Você é um leitor de gráficos com Fibonaccing. Extraia exclusivamente valores que sejam LEGÍVEIS na imagem. Não invente preços.
 Retorne só JSON: {"ticker":string|null,"timeframe":string|null,"direcao":"Compra / Alta"|"Venda / Baixa"|null,
 "ancora_0":number|null,"ancora_100":number|null,"preco_atual":number|null,
 "niveis_visiveis":[{"percentual":number,"preco":number}],"confianca":"alta"|"media"|"baixa","observacoes":string}.
 Não calcule alvos, não presuma a posição dos marcadores 0/100 pela orientação do gráfico. Se a ancoragem
 e os rótulos não forem legíveis, retorne null. Os preços são NUMÉRICOS e precisam corresponder aos rótulos.`;
 const contents=[{role:'user',parts:[{text:instruction},{inlineData:{mimeType:m[1],data:m[2]}}]}];
 const deadline=Date.now()+85000;
 let modelo='';
 let t='';
 let motivo='modelo indisponível';
 for(const candidato of provider.modelos){
  const restante=deadline-Date.now();
  if(restante<3000)break;
  const signal=AbortSignal.timeout(Math.min(38000,restante));
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(candidato)+':generateContent';
  const thinkingConfig=/^gemini-2\.5-flash/.test(candidato)?{thinkingBudget:0}:
   /^gemini-3.*flash/.test(candidato)?{thinkingLevel:'low'}:undefined;
  const body=JSON.stringify({contents,generationConfig:{temperature:0,responseMimeType:'application/json',maxOutputTokens:1700,thinkingConfig}});
  try{
   const tentativa=await fetch(url,{method:'POST',headers:{'x-goog-api-key':provider.chave,'Content-Type':'application/json'},body,signal});
   if(!tentativa.ok){
    await tentativa.body?.cancel();
    motivo='HTTP '+tentativa.status;
    if([404,408,502,503,504].includes(tentativa.status))continue;
    throw Error('Leitura visual indisponível ('+motivo+')');
   }
   const j=await tentativa.json();
   t=(j.candidates?.[0]?.content?.parts||[]).filter((x:any)=>!x.thought).map((x:any)=>x.text||'').join('');
   modelo=candidato;
   break;
  }catch(e){
   if(!signal.aborted && !(e instanceof DOMException && e.name==='TimeoutError'))throw e;
   motivo='tempo de resposta esgotado';
  }
 }
 if(!modelo)throw Error('A leitura do gráfico não foi concluída ('+motivo+'). Tente novamente.');
 let v;try{v=JSON.parse(t)}catch{throw Error('A IA não retornou JSON válido')}
 const number=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e12?n:null;
 const levels=Array.isArray(v.niveis_visiveis)?v.niveis_visiveis.slice(0,35).map((n:any)=>({percentual:number(n.percentual),preco:number(n.preco)})).filter((n:any)=>n.percentual!==null&&n.preco!==null):[];
 return {ticker:short(v.ticker,30)||null,timeframe:short(v.timeframe,16)||null,
 direcao:['Compra / Alta','Venda / Baixa'].includes(v.direcao)?v.direcao:null,
 ancora_0:number(v.ancora_0),ancora_100:number(v.ancora_100),preco_atual:number(v.preco_atual),
 niveis_visiveis:levels,confianca:['alta','media','baixa'].includes(v.confianca)?v.confianca:'baixa',
 observacoes:short(v.observacoes,450),modelo};
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=='POST')return response(req,{erro:'Método não permitido'},405);
 try{
  if(Number(req.headers.get('content-length')||0)>1500000)return response(req,{erro:'Corpo acima do limite'},413);
  if(!sb||!pub)return response(req,{erro:'Configuração Supabase indisponível'},503);
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!jwt)return response(req,{erro:'Autenticação obrigatória'},401);
  const uid=await user(jwt);
  const b=await req.json();if(!b||typeof b!=='object')return response(req,{erro:'JSON inválido'},400);
  if(b.acao==='visao')return response(req,{resultado:await vision(short(b.imagem,1200000))});
  if(b.acao==='indexar'){
   if(!UUID.test(b.obra_id||'')||!TIPO.has(b.tipo_fonte)||!CATEGORIA.has(b.categoria))return response(req,{erro:'Metadados inválidos'},400);
   if(!Array.isArray(b.chunks)||b.chunks.length<1||b.chunks.length>6)return response(req,{erro:'Envie de 1 a 6 blocos por lote'},400);
   const titulo=short(b.titulo_obra,200),autor=short(b.autor,120);if(!titulo)return response(req,{erro:'Título obrigatório'},400);
   const seen=new Set<number>();const rows=[];
   let usarReserva=false;
   for(const c of b.chunks){
    if(!Number.isInteger(c.indice)||c.indice<0||c.indice>=12000||seen.has(c.indice))return response(req,{erro:'Índice inválido ou duplicado'},400);
    const chunk=short(c.texto,1400);if(chunk.length<50||String(c.texto).length>1400)return response(req,{erro:'Bloco deve conter 50 a 1400 caracteres'},400);
    seen.add(c.indice);
    const embedding=usarReserva?null:await vetorDisponivel(chunk,'RETRIEVAL_DOCUMENT');
    if(!embedding)usarReserva=true;
    rows.push({owner_id:uid,obra_id:b.obra_id,chunk_index:c.indice,titulo_obra:titulo,autor,tipo_fonte:b.tipo_fonte,categoria:b.categoria,conteudo_chunk:chunk,embedding,modelo_embedding:embedding?'gemini-embedding-001':'texto-pt',termos_busca:''});
   }
   const pendentes=rows.filter(row=>!row.embedding);
   if(pendentes.length){
    const termos=await termosReserva(pendentes.map(row=>row.conteudo_chunk)).catch(()=>[]);
    pendentes.forEach((row,i)=>{row.termos_busca=termos[i]||''});
   }
   await db('conhecimento_trading?on_conflict=owner_id,obra_id,chunk_index',jwt,{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
   return response(req,{indexados:rows.length,obra_id:b.obra_id});
  }
  if(b.acao==='buscar'){
   const texto=short(b.consulta,480);if(texto.length<3)return response(req,{erro:'Consulta muito curta'},400);
   if(b.filtro_categoria&&!CATEGORIA.has(b.filtro_categoria))return response(req,{erro:'Categoria inválida'},400);
   const vector=await vetorDisponivel(texto,'RETRIEVAL_QUERY');
   const found=await db('rpc/buscar_biblioteca_hibrida',jwt,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consulta:texto,query_embedding:vector,match_count:Math.min(6,Math.max(1,Number(b.match_count)||5)),filtro_categoria:b.filtro_categoria||null})});
   /* v845: peso por qualidade (acerto por obra enviado pelo app) e prazo de validade para artigo, vídeo e macro. */
   let trechos=Array.isArray(found)?found:[];
   if(trechos.length){
    const pesos=b.pesos&&typeof b.pesos==='object'?b.pesos:{};
    const titulos=[...new Set(trechos.map((t:any)=>String(t.titulo_obra||'')))].slice(0,12);
    let idade:Record<string,number>={},macro:Record<string,boolean>={};
    try{const r=await db('conhecimento_trading?select=titulo_obra,categoria,criado_em&titulo_obra=in.('+titulos.map(t=>'"'+t.replace(/"/g,'')+'"').map(encodeURIComponent).join(',')+')&limit=60',jwt);
     for(const x of r||[]){const dias=(Date.now()-Date.parse(x.criado_em))/864e5;if(Number.isFinite(dias))idade[x.titulo_obra]=Math.max(idade[x.titulo_obra]||0,dias);if(x.categoria==='Fatos_Relevantes_Macro')macro[x.titulo_obra]=true;}}catch{}
    trechos=trechos.map((t:any)=>{const p=Number(pesos[t.titulo_obra]);const q=Number.isFinite(p)?0.8+0.4*Math.max(0,Math.min(1,p)):1;
     const efemero=t.tipo_fonte==='Artigo_Web'||t.tipo_fonte==='Video_YouTube'||!!macro[t.titulo_obra];const dias=Math.max(0,idade[t.titulo_obra]??0);
     const v=efemero?Math.max(0.5,1-dias/365):1;const base=Number(t.similarity)||0;return {...t,similarity:base*q*v,similarity_original:base};})
     .sort((a:any,b:any)=>b.similarity-a.similarity);
   }
   return response(req,{trechos});
  }
  /* v845: estudar com o Cérebro — gera material de estudo SÓ a partir dos trechos da biblioteca do usuário. */
  if(b.acao==='gerar'){
   const MODOS:Record<string,string>={
    pergunta:'Crie UMA pergunta de múltipla escolha (4 alternativas, uma correta) baseada nos trechos. JSON: {"pergunta":"","alternativas":["","","",""],"correta":0,"explicacao":"","fonte":"título da obra"}',
    explicar:'Explique o conteúdo dos trechos para um iniciante, em português simples, com um exemplo prático no mini índice (WIN) ou no mini dólar (WDO). JSON: {"titulo":"","explicacao":"","exemplo":"","fonte":""}',
    comparar:'Compare o que cada obra/autor dos trechos diz sobre o tema pedido. JSON: {"tema":"","visoes":[{"obra":"","resumo":""}],"pontos_comuns":"","diferencas":""}',
    mapa:'Monte um mapa de conceitos com os conceitos dos trechos e como se ligam. JSON: {"centro":"","nos":[{"id":"","rotulo":""}],"ligacoes":[{"de":"","para":"","relacao":""}]}',
    simulado:'Crie N questões de múltipla escolha no estilo da prova CNPI-T, com dificuldade indicada, usando os trechos. JSON: {"questoes":[{"pergunta":"","alternativas":["","","",""],"correta":0,"explicacao":"","fonte":"","trecho":"","topico":""}]}',
    resumo:'Faça um resumo para revisão de prova, em tópicos curtos, com os pontos que mais caem. JSON: {"titulo":"","topicos":[""],"para_ouvir":"texto corrido de 1 a 2 minutos para ouvir"}',
    aula_erro:'O erro do usuário está em ERRO. Monte uma aula curta para corrigir esse erro usando os trechos. JSON: {"titulo":"","por_que_acontece":"","o_que_fazer":[""],"exercicio":"","fonte":""}',
    glossario:'Liste termos importantes dos trechos com definição simples em português e o termo em inglês. JSON: {"termos":[{"pt":"","en":"","definicao":""}]}',
    materia:'Ligue a matéria da faculdade em MATERIA a exemplos reais de mercado presentes nos trechos e no contexto. JSON: {"materia":"","ligacoes":[{"conceito":"","exemplo_mercado":""}]}',
    perguntar:'Responda à pergunta usando apenas os trechos e cite a obra de cada afirmação. JSON: {"resposta":"","citacoes":[{"obra":"","trecho":""}],"lacuna":"o que os trechos não cobrem, se houver"}',
    trade:'O trade do usuário está em TRADE. Escolha o trecho que mais se aplica e diga por quê, em 2 frases. JSON: {"trecho":"","obra":"","por_que":""}'
   };
   const modo=String(b.modo||'');if(!MODOS[modo])return response(req,{erro:'Modo inválido'},400);
   const tema=short(b.tema,400)||'gestão de risco análise técnica',extra=short(b.extra,1600),n=Math.max(1,Math.min(10,Number(b.n)||5));
   const vector=await vetorDisponivel(tema,'RETRIEVAL_QUERY');
   const found=await db('rpc/buscar_biblioteca_hibrida',jwt,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consulta:tema,query_embedding:vector,match_count:6,filtro_categoria:CATEGORIA.has(b.filtro_categoria)?b.filtro_categoria:null})}).catch(()=>[]);
   const trechos=(Array.isArray(found)?found:[]).slice(0,6);
   if(!trechos.length)return response(req,{erro:'O Cérebro não tem trechos sobre esse tema ainda. Importe material primeiro.'},404);
   const ctx=trechos.map((t:any,i:number)=>'['+(i+1)+'] '+t.titulo_obra+(t.autor?' ('+t.autor+')':'')+': '+String(t.conteudo_chunk).slice(0,1200)).join('\n\n');
   const sys='Você é um professor de mercado financeiro. Use SOMENTE os trechos fornecidos; não invente números nem fatos. Escreva em português do Brasil. Nunca use a notação R (R-múltiplo); use "vezes o risco", R$ ou %. Responda só com JSON válido.';
   const prompt=MODOS[modo].replace('N questões',n+' questões')+'\n\nTEMA: '+tema+(extra?'\nCONTEXTO: '+extra:'')+'\n\nTRECHOS:\n'+ctx;
   const r=await gerarTexto(sys,prompt,{json:true,temp:0.3,ate:Date.now()+45000});
   let v;try{v=JSON.parse(String(r.texto||'').replace(/^```json\s*|```$/g,''))}catch{return response(req,{erro:'A IA não retornou um resultado válido. Tente de novo.'},502)}
   return response(req,{modo,resultado:v,fontes:[...new Set(trechos.map((t:any)=>t.titulo_obra))],modelo:r.modelo||''});
  }
  /* v845: cobertura — quantos trechos por categoria e por obra, para mostrar onde falta material. */
  if(b.acao==='cobertura'){
   const rows=await db('conhecimento_trading?select=categoria,titulo_obra&limit=20000',jwt);
   const cat:Record<string,number>={},obra:Record<string,number>={};for(const r of rows||[]){cat[r.categoria]=(cat[r.categoria]||0)+1;obra[r.titulo_obra]=(obra[r.titulo_obra]||0)+1;}
   return response(req,{categorias:cat,obras:obra,total:(rows||[]).length});
  }
  /* v845: remover só um trecho errado (dono + obra + texto exato). */
  if(b.acao==='remover_trecho'){
   const titulo=short(b.titulo_obra,200),texto=String(b.conteudo_chunk||'').slice(0,1400);if(!titulo||texto.length<50)return response(req,{erro:'Trecho inválido'},400);
   await db('conhecimento_trading?owner_id=eq.'+uid+'&titulo_obra=eq.'+encodeURIComponent(titulo)+'&conteudo_chunk=eq.'+encodeURIComponent(texto),jwt,{method:'DELETE',headers:{Prefer:'return=minimal'}});
   return response(req,{removido:true});
  }
  if(b.acao==='obras'){
   const rows=await db('conhecimento_trading?select=obra_id,titulo_obra,autor,tipo_fonte,categoria,criado_em&order=criado_em.desc&limit=400',jwt);
   const m=new Map();for(const r of rows||[]){if(!m.has(r.obra_id))m.set(r.obra_id,{...r,blocos:0});m.get(r.obra_id).blocos++}
   return response(req,{obras:[...m.values()]});
  }
  if(b.acao==='remover'){
   if(!UUID.test(b.obra_id||''))return response(req,{erro:'Obra inválida'},400);
   await db('conhecimento_trading?obra_id=eq.'+b.obra_id+'&owner_id=eq.'+uid,jwt,{method:'DELETE',headers:{Prefer:'return=minimal'}});
   return response(req,{removido:b.obra_id});
  }
  return response(req,{erro:'Ação desconhecida'},400);
 }catch(e){const message=String((e as Error)?.message||'Erro').replace(/(?:sk-|AIza|gsk_)[\w-]+/g,'[oculto]').slice(0,240);return response(req,{erro:message},/Sessão inválida|Autenticação/.test(message)?401:503)}
});