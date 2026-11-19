/** v805 — IA de biblioteca e visão; JWT obrigatório, sem Storage, sem polling. */
const sb=Deno.env.get('SUPABASE_URL')||'';
const pub=Deno.env.get('SUPABASE_ANON_KEY')||'';
const key=Deno.env.get('GEMINI_API_KEY')||Deno.env.get('GOOGLE_API_KEY')||'';
const origins=new Set(['https://meudiariotrade.github.io','http://localhost:3000','http://127.0.0.1:3000','http://localhost:5173','http://127.0.0.1:5173']);
function cors(req:Request){const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':origins.has(o)?o:'https://meudiariotrade.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store'}}
function response(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(req),'Content-Type':'application/json'}})}
function short(t:unknown,n:number){return String(t??'').trim().slice(0,n)}
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const TIPO=new Set(['Livro_PDF','Video_YouTube','Artigo_Web','Guia_Mercado']);
const CATEGORIA=new Set(['Analise_Tecnica','Fibonaccing','Price_Action','Fundamentalista','Fatos_Relevantes_Macro','Gestao_Risco']);
async function user(jwt:string){const r=await fetch(sb+'/auth/v1/user',{headers:{apikey:pub,Authorization:'Bearer '+jwt},signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('Sessão inválida ou expirada');const j=await r.json();if(!UUID.test(j.id||''))throw Error('Conta inválida');return j.id}
async function db(path:string,jwt:string,init:RequestInit={}){const r=await fetch(sb+'/rest/v1/'+path,{...init,headers:{apikey:pub,Authorization:'Bearer '+jwt,...init.headers},signal:AbortSignal.timeout(15000)});if(!r.ok){await r.body?.cancel();throw Error('Persistência segura indisponível (HTTP '+r.status+')')}return r.status===204?null:await r.json()}
async function embed(text:string,task:'RETRIEVAL_QUERY'|'RETRIEVAL_DOCUMENT'){
 if(!key)throw Error('Configure GEMINI_API_KEY nos Secrets da Edge Function');
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',{
 method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
 body:JSON.stringify({model:'models/gemini-embedding-001',content:{parts:[{text}]},taskType:task,outputDimensionality:768}),signal:AbortSignal.timeout(18000)});
 if(!r.ok){await r.body?.cancel();throw Error('Embedding indisponível (HTTP '+r.status+')')}
 const v=(await r.json())?.embedding?.values;
 if(!Array.isArray(v)||v.length!==768||!v.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n)))throw Error('Embedding de 768 dimensões não confirmado');
 return v;
}
async function vision(dataURL:string){
 if(!key)throw Error('Configure GEMINI_API_KEY');
 const m=/^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataURL);
 if(!m||m[2].length>1_200_000)throw Error('Imagem inválida ou superior ao limite de segurança');
 const instruction=`Você é um leitor de gráficos com Fibonaccing. Extraia exclusivamente valores que sejam LEGÍVEIS na imagem. Não invente preços.
 Retorne só JSON: {"ticker":string|null,"timeframe":string|null,"direcao":"Compra / Alta"|"Venda / Baixa"|null,
 "ancora_0":number|null,"ancora_100":number|null,"preco_atual":number|null,
 "niveis_visiveis":[{"percentual":number,"preco":number}],"confianca":"alta"|"media"|"baixa","observacoes":string}.
 Não calcule alvos, não presuma a posição dos marcadores 0/100 pela orientação do gráfico. Se a ancoragem
 e os rótulos não forem legíveis, retorne null. Os preços são NUMÉRICOS e precisam corresponder aos rótulos.`;
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
 method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
 body:JSON.stringify({contents:[{role:'user',parts:[{text:instruction},{inlineData:{mimeType:m[1],data:m[2]}}]}],generationConfig:{temperature:0,responseMimeType:'application/json',maxOutputTokens:1700}}),
 signal:AbortSignal.timeout(24000)});
 if(!r.ok){await r.body?.cancel();throw Error('Leitura visual indisponível (HTTP '+r.status+')')}
 const j=await r.json(),t=(j.candidates?.[0]?.content?.parts||[]).map((x:any)=>x.text||'').join('');
 let v;try{v=JSON.parse(t)}catch{throw Error('A IA não retornou JSON válido')}
 const number=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e12?n:null;
 const levels=Array.isArray(v.niveis_visiveis)?v.niveis_visiveis.slice(0,35).map((n:any)=>({percentual:number(n.percentual),preco:number(n.preco)})).filter((n:any)=>n.percentual!==null&&n.preco!==null):[];
 return {ticker:short(v.ticker,30)||null,timeframe:short(v.timeframe,16)||null,
 direcao:['Compra / Alta','Venda / Baixa'].includes(v.direcao)?v.direcao:null,
 ancora_0:number(v.ancora_0),ancora_100:number(v.ancora_100),preco_atual:number(v.preco_atual),
 niveis_visiveis:levels,confianca:['alta','media','baixa'].includes(v.confianca)?v.confianca:'baixa',
 observacoes:short(v.observacoes,450),modelo:'gemini-2.5-flash'};
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
   for(const c of b.chunks){
    if(!Number.isInteger(c.indice)||c.indice<0||c.indice>=150||seen.has(c.indice))return response(req,{erro:'Índice inválido ou duplicado'},400);
    const chunk=short(c.texto,1400);if(chunk.length<50||String(c.texto).length>1400)return response(req,{erro:'Bloco deve conter 50 a 1400 caracteres'},400);
    seen.add(c.indice);
    rows.push({owner_id:uid,obra_id:b.obra_id,chunk_index:c.indice,titulo_obra:titulo,autor,tipo_fonte:b.tipo_fonte,categoria:b.categoria,conteudo_chunk:chunk,embedding:await embed(chunk,'RETRIEVAL_DOCUMENT')});
   }
   await db('conhecimento_trading?on_conflict=owner_id,obra_id,chunk_index',jwt,{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
   return response(req,{indexados:rows.length,obra_id:b.obra_id});
  }
  if(b.acao==='buscar'){
   const texto=short(b.consulta,480);if(texto.length<3)return response(req,{erro:'Consulta muito curta'},400);
   if(b.filtro_categoria&&!CATEGORIA.has(b.filtro_categoria))return response(req,{erro:'Categoria inválida'},400);
   const vector=await embed(texto,'RETRIEVAL_QUERY');
   const found=await db('rpc/buscar_conhecimento_trading',jwt,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query_embedding:vector,match_count:Math.min(6,Math.max(1,Number(b.match_count)||5)),filtro_categoria:b.filtro_categoria||null})});
   return response(req,{trechos:found||[]});
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