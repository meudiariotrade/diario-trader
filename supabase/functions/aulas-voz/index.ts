
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
const env=(k:string)=>Deno.env.get(k)||"";
const URL0=env("SUPABASE_URL"),SVC=env("SUPABASE_SERVICE_ROLE_KEY"),ANON=env("SUPABASE_ANON_KEY"),KEY=env("GEMINI_API_KEY");
const DB=createClient(URL0,SVC,{auth:{persistSession:false,autoRefreshToken:false}});
const BUCKET="aulas-audio",MODEL="gemini-2.5-flash-preview-tts";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const voices=new Set(["Kore","Charon","Aoede","Fenrir"]);
const origin=(env("ALLOWED_ORIGINS")||"").split(",").map(s=>{try{return new URL(s.trim()).origin}catch{return s.trim()}}).filter(Boolean);
function cors(req:Request){const o=req.headers.get("Origin")||"";return {"Access-Control-Allow-Origin":origin.length?(origin.includes(o)?o:"null"):"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}}
function respond(obj:unknown,status:number,h:Record<string,string>){return new Response(JSON.stringify(obj),{status,headers:{...h,"Content-Type":"application/json","Cache-Control":"no-store"}})}
function fromB64(s:string){const bin=atob(s),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a}
function toWav(pcm:Uint8Array){const b=new Uint8Array(44+pcm.length),v=new DataView(b.buffer);const txt=(offset:number,s:string)=>{for(let i=0;i<s.length;i++)b[offset+i]=s.charCodeAt(i)};txt(0,"RIFF");v.setUint32(4,36+pcm.length,true);txt(8,"WAVE");txt(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);txt(36,"data");v.setUint32(40,pcm.length,true);b.set(pcm,44);return b}
async function signed(path:string){const {data,error}=await DB.storage.from(BUCKET).createSignedUrl(path,1800);if(error||!data?.signedUrl)throw Error("Áudio indisponível.");return data.signedUrl}
Deno.serve(async req=>{
 const h=cors(req);
 if(req.method==="OPTIONS")return new Response("ok",{headers:h});
 if(req.method!=="POST")return respond({error:"Método não permitido."},405,h);
 if(!URL0||!SVC||!ANON)return respond({error:"Serviço indisponível."},503,h);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token||token===ANON||token===SVC)return respond({error:"Entre na conta para usar a voz neural."},401,h);
 const {data:session,error:err}=await DB.auth.getUser(token);
 if(err||!session?.user?.id)return respond({error:"Sessão inválida."},401,h);
 const uid=session.user.id;
 let b:any;try{b=await req.json()}catch{return respond({error:"Pedido inválido."},400,h)}
 const id=String(b.aula||""),scene=Number(b.cena),voice=String(b.voz||"Kore"),action=String(b.acao||"consultar");
 if(!uuid.test(id)||!Number.isInteger(scene)||scene<0||scene>299||!voices.has(voice)||!["consultar","gerar"].includes(action))return respond({error:"Parâmetros inválidos."},400,h);
 const {data:lesson,error:le}=await DB.from("aulas").select("id,roteiro,titulo").eq("id",id).eq("user_id",uid).maybeSingle();
 if(le||!lesson)return respond({error:"Aula não encontrada nesta conta."},404,h);
 const scenes=Array.isArray(lesson.roteiro?.cenas)?lesson.roteiro.cenas:[];
 const sc=scenes[scene];if(!sc||!Array.isArray(sc.fala))return respond({error:"Cena sem narração."},400,h);
 const {data:job,error:je}=await DB.from("aulas_audio_jobs").select("id,estado,caminho,atualizado").eq("user_id",uid).eq("aula_id",id).eq("cena",scene).eq("voz",voice).maybeSingle();
 if(je)return respond({error:"Falha ao consultar a biblioteca de áudio."},503,h);
 if(job?.estado==="pronta"&&job.caminho){try{return respond({ok:true,existe:true,url:await signed(job.caminho)},200,h)}catch{return respond({error:"Áudio armazenado indisponível."},502,h)}}
 if(action==="consultar")return respond({ok:true,existe:false,gerando:job?.estado==="gerando"&&Date.now()-Date.parse(job.atualizado)<180000},200,h);
 if(!KEY)return respond({error:"Chave de geração de voz não configurada."},503,h);
 if(job?.estado==="gerando"&&Date.now()-Date.parse(job.atualizado)<180000)return respond({error:"Áudio já está em geração."},409,h);
 const day=new Date();day.setUTCHours(0,0,0,0);
 const {count,error:qe}=await DB.from("aulas_audio_jobs").select("id",{head:true,count:"exact"}).eq("user_id",uid).gte("criado",day.toISOString());
 if(qe)return respond({error:"Não foi possível conferir o limite diário."},503,h);
 if((count||0)>=8)return respond({error:"Limite de 8 cenas de voz por dia atingido."},429,h);
 const content=sc.fala.map((s:unknown)=>String(s||"")).join(" ").replace(/\s+/g," ").trim();
 if(content.length<3||content.length>1800)return respond({error:"Esta cena é muito longa para uma geração; use a voz do aparelho."},400,h);
 let claimed=false,jobId=job?.id;
 if(job){
  const {data:changed}=await DB.from("aulas_audio_jobs").update({estado:"gerando",atualizado:new Date().toISOString(),criado:new Date().toISOString()}).eq("id",job.id).eq("atualizado",job.atualizado).select("id").maybeSingle();claimed=!!changed;
 }else{
  const {data:created,error:e}=await DB.from("aulas_audio_jobs").insert({user_id:uid,aula_id:id,cena:scene,voz:voice,estado:"gerando"}).select("id").maybeSingle();claimed=!!created&&!e;jobId=created?.id;
 }
 if(!claimed)return respond({error:"Outra janela está gerando esta narração."},409,h);
 try{
  const instruction="Narre exatamente este texto em português brasileiro natural, como um professor experiente e acolhedor de análise técnica. Tom claro, conversacional, pausas naturais, pronúncia brasileira. Não invente nem acrescente palavras. Texto: "+content;
  const rr=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":KEY},body:JSON.stringify({contents:[{parts:[{text:instruction}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}}),signal:AbortSignal.timeout(100000)});
  const out=await rr.json();if(!rr.ok)throw Error("Provedor de voz não respondeu ("+rr.status+").");
  const data=(out?.candidates?.[0]?.content?.parts||[]).find((x:any)=>x.inlineData?.data)?.inlineData;
  if(!data?.data)throw Error("A IA não retornou áudio.");
  const raw=fromB64(data.data);if(!raw.length||raw.length>17*1024*1024)throw Error("Áudio excede o limite.");
  const mime=String(data.mimeType||"");
  const wav=mime.includes("wav")?raw:toWav(raw);
  const path=uid+"/"+id+"/"+scene+"-"+voice+".wav";
  const {error:up}=await DB.storage.from(BUCKET).upload(path,wav,{upsert:false,contentType:"audio/wav",cacheControl:"3600"});
  if(up&&!/already exists/i.test(String(up.message)))throw Error("Falha ao salvar o áudio.");
  const {error:saved}=await DB.from("aulas_audio_jobs").update({estado:"pronta",caminho:path,atualizado:new Date().toISOString()}).eq("id",jobId);
  if(saved)throw Error("Falha ao registrar áudio.");
  return respond({ok:true,existe:true,url:await signed(path),gerado:true,voz:voice,modelo:MODEL},200,h);
 }catch(e){
  try{await DB.from("aulas_audio_jobs").update({estado:"erro",atualizado:new Date().toISOString()}).eq("id",jobId)}catch{}
  return respond({error:String((e as Error)?.message||"Falha ao gerar áudio.").slice(0,160)},502,h);
 }
});
