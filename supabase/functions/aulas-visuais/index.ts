
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const SB=Deno.env.get("SUPABASE_URL")||"";
const SVC=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const ANON=Deno.env.get("SUPABASE_ANON_KEY")||"";
const GEMINI=Deno.env.get("GEMINI_API_KEY")||"";
const BUCKET="aulas-visuais";
const MODEL="gemini-2.5-flash-image";
const sb=createClient(SB,SVC,{auth:{persistSession:false,autoRefreshToken:false}});
const ORIG=(Deno.env.get("ALLOWED_ORIGINS")||"").split(",").map(s=>{try{return new URL(s.trim()).origin}catch{return s.trim()}}).filter(Boolean);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cors=(req:Request)=>{const o=req.headers.get("origin")||"";return {"Access-Control-Allow-Origin":ORIG.length?(ORIG.includes(o)?o:"null"):"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type,authorization,apikey,x-client-info","Vary":"Origin"}};
const plain=(x:unknown,n:number)=>String(x||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").slice(0,n);
const json=(data:unknown,status:number,h:Record<string,string>)=>new Response(JSON.stringify(data),{status,headers:{...h,"Content-Type":"application/json","Cache-Control":"no-store"}});
async function urlAssinada(path:string){const {data,error}=await sb.storage.from(BUCKET).createSignedUrl(path,3600);if(error||!data?.signedUrl)throw Error("Não consegui abrir a imagem armazenada.");return data.signedUrl}
function bytesB64(b64:string){const bin=atob(b64),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}
Deno.serve(async req=>{
 const h=cors(req);
 if(req.method==="OPTIONS")return new Response("ok",{headers:h});
 if(req.method!=="POST")return json({error:"Método inválido."},405,h);
 if(!SB||!SVC||!ANON)return json({error:"Serviço não configurado."},503,h);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token||token===ANON||token===SVC)return json({error:"Entre na sua conta para visualizar as imagens."},401,h);
 const {data:usr,error:authErr}=await sb.auth.getUser(token);
 if(authErr||!usr?.user?.id)return json({error:"Sessão expirada. Entre novamente."},401,h);
 const uid=usr.user.id;
 let b:any;try{b=await req.json()}catch{return json({error:"Pedido inválido."},400,h)}
 const id=String(b?.aula||""),cena=Number(b?.cena),acao=String(b?.acao||"consultar");
 if(!uuid.test(id)||!Number.isInteger(cena)||cena<0||cena>299||!["consultar","gerar"].includes(acao))return json({error:"Cena inválida."},400,h);
 const {data:aula,error:eAula}=await sb.from("aulas").select("id,user_id,roteiro,titulo,livro,status").eq("id",id).eq("user_id",uid).maybeSingle();
 if(eAula||!aula)return json({error:"Aula não encontrada nesta conta."},404,h);
 const cenas=Array.isArray(aula.roteiro?.cenas)?aula.roteiro.cenas:[];
 if(cena>=cenas.length)return json({error:"Cena fora do roteiro."},400,h);
 const {data:job,error:eJob}=await sb.from("aulas_imagens_jobs").select("id,estado,caminho,atualizado").eq("user_id",uid).eq("aula_id",id).eq("cena",cena).maybeSingle();
 if(eJob)return json({error:"Falha ao consultar a biblioteca visual."},503,h);
 if(job?.estado==="pronta"&&job.caminho){try{return json({ok:true,existe:true,url:await urlAssinada(job.caminho),modelo:MODEL},200,h)}catch{return json({error:"Imagem indisponível no armazenamento."},502,h)}}
 if(acao==="consultar")return json({ok:true,existe:false,gerando:job?.estado==="gerando"&&Date.now()-Date.parse(job.atualizado)<180000},200,h);
 if(!GEMINI)return json({error:"A chave de IA de imagens ainda não está configurada no servidor."},503,h);
 if(job?.estado==="gerando"&&Date.now()-Date.parse(job.atualizado)<180000)return json({error:"Esta cena já está sendo gerada. Tente consultar novamente."},409,h);
 const today=new Date();today.setUTCHours(0,0,0,0);
 const {count,error:cntErr}=await sb.from("aulas_imagens_jobs").select("id",{head:true,count:"exact"}).eq("user_id",uid).gte("criado",today.toISOString());
 if(cntErr)return json({error:"Não consegui verificar o limite diário."},503,h);
 if((count||0)>=5)return json({error:"Limite de 5 imagens por dia atingido nesta conta."},429,h);
 let claimed=false,jobId=job?.id;
 if(job){
   if(job.estado!=="erro"&&!(job.estado==="gerando"&&Date.now()-Date.parse(job.atualizado)>180000))return json({error:"Esta imagem está em processamento."},409,h);
   const {data:updated}=await sb.from("aulas_imagens_jobs").update({estado:"gerando",atualizado:new Date().toISOString(),criado:new Date().toISOString()}).eq("id",job.id).eq("atualizado",job.atualizado).select("id").maybeSingle();
   claimed=!!updated;
 }else{
   const {data:created,error:insertErr}=await sb.from("aulas_imagens_jobs").insert({user_id:uid,aula_id:id,cena,estado:"gerando"}).select("id").maybeSingle();
   claimed=!!created&&!insertErr;jobId=created?.id;
 }
 if(!claimed)return json({error:"Outra janela está gerando esta imagem."},409,h);
 try{
  const sc=cenas[cena],txt=plain((Array.isArray(sc.fala)?sc.fala:[]).join(" "),800);
  const prompt="Crie UMA ILUSTRAÇÃO educacional original, horizontal 16:9, para uma videoaula brasileira sobre mercados financeiros. Visual premium, fundo azul-marinho, alto contraste, composição simples, sem texto nem letras na imagem. Tema da cena: "+plain(sc.titulo,130)+". Contexto da aula: "+plain(aula.titulo,130)+". Explicação: "+txt+". NÃO invente empresas ou logotipos, NÃO apresente preço ou gráfico histórico como real, NÃO reproduza páginas de livros. Se houver candles, use dados FICTÍCIOS e conceito visual genérico. Sem recomendações financeiras.";
  const modelResp=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:"16:9"}}}),signal:AbortSignal.timeout(90000)});
  const generated=await modelResp.json();
  if(!modelResp.ok)throw Error("Modelo de imagens indisponível ("+modelResp.status+").");
  const part=(generated?.candidates?.[0]?.content?.parts||[]).find((v:any)=>v.inlineData?.data);
  if(!part)throw Error("O modelo não retornou uma imagem.");
  const mime=String(part.inlineData.mimeType||"image/png");if(!["image/png","image/jpeg","image/webp"].includes(mime))throw Error("Formato de imagem não aceito.");
  const bytes=bytesB64(part.inlineData.data);if(!bytes.length||bytes.length>5242880)throw Error("Imagem excede o tamanho permitido.");
  const ext=mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":"png";
  const path=uid+"/"+id+"/cena-"+cena+"."+ext;
  const {error:uploadErr}=await sb.storage.from(BUCKET).upload(path,bytes,{upsert:false,contentType:mime,cacheControl:"3600"});
  if(uploadErr&&!String(uploadErr.message).includes("already exists"))throw Error("Falha ao guardar imagem no Supabase.");
  const {error:saveErr}=await sb.from("aulas_imagens_jobs").update({estado:"pronta",caminho:path,atualizado:new Date().toISOString()}).eq("id",jobId);
  if(saveErr)throw Error("Falha ao registrar a imagem.");
  return json({ok:true,existe:true,url:await urlAssinada(path),modelo:MODEL,gerada:true},200,h);
 }catch(e){try{await sb.from("aulas_imagens_jobs").update({estado:"erro",atualizado:new Date().toISOString()}).eq("id",jobId)}catch{};return json({error:plain((e as Error).message,180)},502,h)}
});
