/* Pesquisa: exportação PDF local, sem alterar os relatórios editoriais existentes. */
(function(w){'use strict';
async function build(job){
 const r=job?.resultado;
 if(!r?.texto)throw Error('Não confirmado / Não calculável: pesquisa sem relatório.');
 const load=f=>w.DiarioChunks?.load?w.DiarioChunks.load(f):new Promise((ok,no)=>{const el=document.createElement('script');el.src=f;el.onload=ok;el.onerror=no;document.head.appendChild(el)});
 if(!w.PDFLib)await load('pdf-lib.min.js');
 if(!w.fontkit)await load('fontkit.umd.min.js');
 if(!w.PDFLib||!w.fontkit)throw Error('Motor PDF indisponível.');
 const P=w.PDFLib,doc=await P.PDFDocument.create();doc.registerFontkit(w.fontkit);
 const font=async f=>{const resp=await fetch(f,{cache:'force-cache'});if(!resp.ok)throw Error('Fonte PDF indisponível');return doc.embedFont(new Uint8Array(await resp.arrayBuffer()),{subset:true})};
 const [normal,bold]=await Promise.all([font('pdf-sans.ttf'),font('pdf-sans-bold.ttf')]);
 const W=595.28,H=841.89,M=43,dark=P.rgb(.07,.09,.12),gold=P.rgb(.83,.63,.09),ink=P.rgb(.11,.14,.18);
 let page,y,pages=0;
 function add(){page=doc.addPage([W,H]);pages++;page.drawRectangle({x:0,y:H-75,width:W,height:75,color:dark});
  page.drawText('DIÁRIO DE TRADER / PESQUISA',{x:M,y:H-39,font:bold,size:12,color:gold});
  page.drawText('RELATÓRIO DE ESTUDO · ANÁLISES B3 & EUA',{x:M,y:H-55,font:normal,size:8,color:P.rgb(.86,.87,.9)});y=H-100;}
 function line(text,heading=false){
  const face=heading?bold:normal,size=heading?11:9,step=heading?18:13;
  const draw=s=>{if(y<65)add();page.drawText(s.slice(0,250),{x:M,y,size,font:face,color:heading?gold:ink});y-=step};
  let wordLine='';
  for(const word of String(text).split(/\s+/)){const next=wordLine?wordLine+' '+word:word;
   if(face.widthOfTextAtSize(next,size)>W-2*M&&wordLine){draw(wordLine);wordLine=word}else wordLine=next}
  if(wordLine)draw(wordLine);else y-=6;
 }
 add();
 const content=String(r.texto).replace(/<[^>]+>/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
 for(const text of content.split('\n').slice(0,3500)){
  const heading=/^#{1,4}\s/.test(text),plain=text.replace(/^#{1,4}\s*/,'').replace(/^[>*-]\s*/,'').replace(/\*\*|[_\`]/g,'').replace(/\|/g,'   ');
  if(plain.trim())line(plain,heading);else y-=5;
 }
 line('FONTES CONSULTADAS',true);
 for(const source of (r.fontes||[]).slice(0,24))line(String(source.titulo||'Fonte')+' — '+String(source.url||''));
 line('Consulta: '+String(r.consultado_em||'Não confirmado / Não calculável'));
 doc.setTitle('Pesquisa B3 e EUA — Diário de Trader');doc.setAuthor('Diário de Trader');
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Pesquisa-'+String(job.id||'analise').slice(0,8)+'.pdf',pages};
}
async function share(job,ticket=null){
 try{return await w.DiarioPDFiOS.deliver(await build(job),'Pesquisa B3 e EUA — Diário de Trader',ticket)}
 catch(e){ticket?.close?.();throw e}
}
w.DiarioPesquisaPDF={build,share};
})(window);
