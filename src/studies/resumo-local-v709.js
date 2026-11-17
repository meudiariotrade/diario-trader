/* Estudos · Resumos PDF locais v709. O PDF nunca sai do aparelho.
   Só trechos limitados de texto são enviados à IA. Não há polling ou Storage. */
;(function(){
 'use strict';
 const MAX_PAGES=240,MAX_PARTS=45,CHARS=18000,MAX_PDF=50*1024*1024;
 const session=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'';
 const ensure=()=>{if(!window.EstudosLocal)throw Error('IndexedDB de Estudos indisponível.');};
 const jobs=()=>RS.jobs||{};
 const persistJobs=()=>{ls.set('diario-rs',RS.jobs);if(typeof rsRefresh==='function')rsRefresh();};
 const byId=id=>Object.values(jobs()).find(j=>j&&j.local&&j.owner===session()&&j.id===id);
 const jobFor=bookId=>jobs()[bookId]?.local&&jobs()[bookId]?.owner===session()?jobs()[bookId]:null;
 const words=t=>String(t||'').trim().split(/\s+/).filter(Boolean).length;
 async function save(bookId,record){
  ensure();const blob=new Blob([JSON.stringify(record)],{type:'application/json'});
  await window.EstudosLocal.put('resumo-local',bookId,blob,{nome:record?.titulo||'',formato:'json-v709'});
 }
 async function read(bookId){
  ensure();const row=await window.EstudosLocal.get('resumo-local',bookId);
  return row?.blob?JSON.parse(await row.blob.text()):null;
 }
 async function carregar(bookId){
  const data=await read(bookId);if(!data)return null;
  const record={id:data.id,at:Date.now(),longo:{partes:data.partes||[]},resultado:data.resultado||null,extras:data.extras||[]};
  RS.full[bookId]=record;
  return record;
 }
 async function extract(pdfFile,progress){
  if(pdfFile.size>MAX_PDF||pdfFile.size<=0)throw Error('Escolha um PDF válido de até 50 MB.');
  const header=new TextDecoder().decode((await pdfFile.slice(0,1024).arrayBuffer()));
  if(!header.includes('%PDF-'))throw Error('O arquivo não parece ser um PDF válido.');
  const lib=await ntLib(),task=lib.getDocument({data:new Uint8Array(await pdfFile.arrayBuffer()),isEvalSupported:false,enableScripting:false});
  const pdf=await task.promise,parts=[];let text='',start=1,end=1;
  try{
   if(pdf.numPages>MAX_PAGES)throw Error('Para não sobrecarregar o iPhone e a IA, processe um PDF de até '+MAX_PAGES+' páginas por vez.');
   for(let p=1;p<=pdf.numPages;p++){
    if(session()!==progress.uid)throw Error('Conta alterada durante a leitura do PDF.');
    const page=await pdf.getPage(p),content=await page.getTextContent();
    const raw=(content.items||[]).map(x=>x.str||'').join(' ').replace(/\s+/g,' ').trim();
    page.cleanup?.();
    if(raw.length>CHARS)throw Error('A página '+p+' contém texto demais; divida o PDF em partes menores.');
    if(text&&(text.length+raw.length>CHARS||p-start>=7)){
      if(text.length>=250)parts.push({inicio:start,fim:end,texto:text});
      text='';start=p;
    }
    if(raw){text+=(text?' \n ':'')+'[Página '+p+'] '+raw;end=p;}
    progress.step(p,pdf.numPages);
   }
   if(text.length>=250)parts.push({inicio:start,fim:end,texto:text});
   if(!parts.length)throw Error('PDF sem texto selecionável. Converta o documento com OCR no PC.');
   if(parts.length>MAX_PARTS)throw Error('PDF muito extenso para uma sessão. Divida-o em volumes menores.');
   return {parts,pages:pdf.numPages};
  }finally{await pdf.destroy();}
 }
 async function gerar(book,foco,file,opt={}){
  ensure();if(!session())throw Error('Entre na conta para usar a IA.');
  if(!file)throw Error('Anexe o PDF do livro.');
  const modo=opt?.modo==='completo'?'completo':'padrao',uid=session(),old=jobFor(book.id);
  let job={id:old?.id||'local-'+(crypto.randomUUID?.()||Date.now()),book_id:book.id,titulo:book.t,autor:book.a||'',foco:String(foco||''),local:true,modo,paginas:modo==='completo'?Number(opt.paginas||100):null,status:'processando',criado:new Date().toISOString(),atualizado:new Date().toISOString(),progresso:{etapa:'lendo',partes:0,prontas:0,geral:0},resultado:old?.resultado||null,owner:uid,prompt:String(opt.prompt||'')};
  const previous=jobs()[book.id],saveStatus=()=>{job.atualizado=new Date().toISOString();RS.jobs[book.id]=job;persistJobs();};
  RS.jobs[book.id]=job;saveStatus();
  try{
   await window.EstudosLocal.put('livro-pdf',book.id,file,{nome:file.name||book.t});
   let progress=(page,pages)=>{job.progresso={...job.progresso,etapa:'lendo',paginas_originais:pages,pagina_lida:page};if(page===1||page%5===0||page===pages)saveStatus();};
   progress.uid=uid;progress.step=progress;
   const extracted=await extract(file,progress);
   const requests=modo==='completo'?extracted.parts:extracted.parts.slice(0,Math.min(5,extracted.parts.length));
   const partials=[];let stored={id:job.id,titulo:book.t,modo,partes:[],resultado:job.resultado,extras:[],origem:'pdf'};
   for(let i=0;i<requests.length;i++){
    if(uid!==session())throw Error('Conta alterada. A geração foi interrompida.');
    job.progresso={etapa:'parte',partes:requests.length,prontas:i,parte:i+1,geral:0,meta_paginas:job.paginas||null};saveStatus();
    const section=requests[i];
    const output=await rsFn('texto_local_parte',{titulo:book.t,autor:book.a||'',foco,modo,parte:i+1,total:requests.length,inicio:section.inicio,fim:section.fim,texto:section.texto,prompt:job.prompt});
    if(!output?.texto||output.texto.length<250)throw Error('A IA não conseguiu resumir as páginas '+section.inicio+' a '+section.fim+'.');
    const part={titulo:'Parte '+(i+1)+' · páginas '+section.inicio+'–'+section.fim,paginas:section.inicio+'–'+section.fim,texto:output.texto,palavras:words(output.texto)};
    partials.push(part);stored.partes=partials.slice();await save(book.id,stored);
    RS.full[book.id]={id:job.id,at:Date.now(),longo:{partes:partials.slice()},resultado:stored.resultado,extras:stored.extras};
    job.progresso={...job.progresso,prontas:i+1};saveStatus();
   }
   const base=partials.map(p=>'# '+p.titulo+'\n'+p.texto).join('\n\n').slice(0,45000);
   job.progresso={...job.progresso,etapa:'geral',geral:0};saveStatus();
   const final=await rsFn('texto_local_final',{titulo:book.t,autor:book.a||'',foco,modo,resumos:base});
   if(!final?.resultado)throw Error('A IA não consolidou o resumo.');
   const count=partials.reduce((n,p)=>n+p.palavras,0),estimate=Math.max(1,Math.ceil(count/400));
   final.resultado.completo=modo==='completo'?{partes:partials.length,palavras:count,paginas:estimate,meta_paginas:job.paginas,paginas_originais:extracted.pages}:undefined;
   stored.resultado=final.resultado;stored.concluido=new Date().toISOString();await save(book.id,stored);
   job.resultado=final.resultado;job.status='concluido';job.concluido=stored.concluido;
   job.progresso={...job.progresso,etapa:'fim',geral:1,palavras:count,paginas:estimate};saveStatus();
   RS.full[book.id]={id:job.id,at:Date.now(),longo:{partes:partials},resultado:final.resultado,extras:stored.extras};
   window.toast?.('Resumo do PDF salvo neste aparelho. Exporte backup JSON.',5500);
   return job;
  }catch(err){
   job.status='erro';job.erro=String(err?.message||err).slice(0,350);
   if(previous&&!(await read(book.id).catch(()=>null)))RS.jobs[book.id]=previous;
   else saveStatus();
   window.toast?.(job.erro,5500);throw err;
  }
 }
 async function handleFn(action,args){
  const j=byId(args?.id);if(!j)return null;
  const bookId=j.book_id,book=(S.books||[]).find(b=>b.id===bookId);
  if(action==='obter'){const data=await read(bookId);if(!data)throw Error('Resumo local não encontrado.');return {item:{id:j.id,resultado:data.resultado,longo:{partes:data.partes||[]},extras:data.extras||[],modo:j.modo}};}
  if(action==='apagar'){
   if(typeof window.EstudosLocal.remove==='function')await window.EstudosLocal.remove('resumo-local',bookId);
   delete RS.full[bookId];return {ok:true};
  }
  if(action==='retomar'){
   const pdf=await window.EstudosLocal.get('livro-pdf',bookId);if(!pdf?.blob)throw Error('PDF local não encontrado. Importe um backup JSON.');
   if(!book)throw Error('Livro não encontrado na Biblioteca.');
   await gerar(book,j.foco,new File([pdf.blob],pdf.meta?.nome||'livro.pdf',{type:'application/pdf'}),{modo:j.modo,paginas:j.paginas,prompt:j.prompt});return {ok:true,status:'concluido'};
  }
  const data=await read(bookId);if(!data)throw Error('Resumo local não encontrado.');
  if(action==='extra_apagar'){
   data.extras=(data.extras||[]).filter(x=>x.id!==args.eid);await save(bookId,data);await carregar(bookId);return {ok:true,extras:data.extras};
  }
  if(action==='extra'||action==='quiz'){
   const base=(data.partes||[]).map(p=>p.texto).join('\n').slice(0,35000);
   const output=await rsFn(action==='extra'?'texto_local_extra':'texto_local_quiz',{titulo:j.titulo,autor:j.autor,resumos:base,prompt:args.prompt||'',tituloExtra:args.titulo||'',n:args.n,nivel:args.nivel});
   if(!output?.item)throw Error('A IA não retornou o resultado.');
   data.extras=[output.item,...(data.extras||[])].slice(0,20);await save(bookId,data);await carregar(bookId);
   return {ok:true,item:output.item,extras:data.extras};
  }
  throw Error('Operação local não suportada: '+action);
 }
 window.ResumosLocais={gerar,carregar,handleFn,byId,jobFor};
})();