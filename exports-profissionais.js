/* v308 — identidade de PDFs vetoriais e imagens de compartilhamento.
   As fontes, fórmulas e opções de privacidade continuam nos módulos originais. */
(function(root){
 'use strict';
 const PDF={tx:'#203247',mut:'#536575',bd:'#d8e1e9',bg:'#f4f7fa',ac:'#087c55',dk:'#0b1b2b',g:'#087c55',r:'#bd343b',am:'#946100',bl:'#35669a',wh:'#ffffff',g2:'#e4f4ec',r2:'#fcebed',am2:'#fff3d5',bl2:'#eaf1f8',cz:'#f1f5f8',li:'#b6e7d4',li2:'#b7c8d8'};
 const IMAGE={bg:'#0b1119',card:'#121c28',raised:'#182535',line:'#293848',tx:'#edf3f8',mut:'#a0b0c2',ac:'#36d998',g:'#36d998',r:'#ff858c',am:'#f0b429'};
 const finite=x=>typeof x==='number'&&Number.isFinite(x),num=(x,d=2)=>finite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const pc=x=>finite(x)?(x>0?'+':'')+num(x)+'%':'—';
 const stack='system-ui,-apple-system,"Segoe UI",Arial,sans-serif';
 function footer(p){
  const active=p.pg,pages=p.doc.getPages();
  pages.forEach((page,i)=>{
   p.pg=page;const C=p.C;
   p.rect(0,p.H-55,p.W,55,{fill:p.hex(PDF.wh)});
   p.ln(p.M,p.H-49,p.W-p.M,p.H-49,{c:p.hex(PDF.bd),w:.7});
   p.t('DIÁRIO DE TRADER',p.M,p.H-37,{s:7.5,f:'b',c:p.hex(PDF.ac)});
   p.t('Página '+(i+1)+' de '+pages.length,p.W-p.M,p.H-37,{s:7.5,f:'b',al:'r',c:p.hex(PDF.mut)});
   const ref=String(p.meta?.data||'Referência não informada');
   const content=(p.meta?.demo?'DEMONSTRAÇÃO / DADOS FICTÍCIOS · ':'Uso pessoal · ')+ref;
   p.t(content,p.M,p.H-23,{s:7,c:p.hex(PDF.mut),w:p.CW});
   if(i){
    p.rect(0,0,p.W,51,{fill:p.hex(PDF.wh)});
    p.rect(0,0,p.W,4,{fill:p.hex(PDF.dk)});
    p.t('DIÁRIO DE TRADER',p.M,20,{s:7.5,f:'b',c:p.hex(PDF.ac)});
    p.t(p.meta?.cabecalho||p.meta?.titulo||'Relatório',p.M+100,20,{s:7.5,c:p.hex(PDF.mut),w:p.CW-100});
    p.ln(p.M,43,p.W-p.M,43,{c:p.hex(PDF.bd),w:.65});
   }
  });p.pg=active;
 }
 function cover(p,d){
  const C=p.C,reserve=d.preco||d.rec?165:0,left=p.CW-reserve;
  const lines=p.wrap(d.titulo||p.meta.titulo||'Relatório',left,26,'b');
  const sub=p.wrap(d.sub||'',left,9.5),h=Math.max(154,75+lines.length*31+sub.length*13+22);
  p.rect(0,0,p.W,h,{fill:C.dk});p.rect(0,h-3,p.W,3,{fill:C.ac});
  p.t('DIÁRIO DE TRADER',p.M,25,{s:8.5,f:'b',c:C.li});
  p.t(d.tipo||p.meta.tipo||'ACOMPANHAMENTO',p.M,43,{s:9,c:C.li2,w:p.CW});
  let y=73;for(const line of lines){p.t(line,p.M,y,{s:26,f:'b',c:C.wh});y+=31}
  for(const line of sub){p.t(line,p.M,y+5,{s:9.5,c:C.li2});y+=13}
  if(reserve){const right=p.W-p.M;if(d.rec){const label=p.wrap(d.rec,147,9,'b');label.forEach((line,i)=>p.t(line,right,69+i*13,{s:9,f:'b',al:'r',c:C.li}))}if(d.preco)p.t(d.preco,right,h-64,{s:20,f:'b',al:'r',c:C.wh,w:150});if(d.precoSub)p.t(d.precoSub,right,h-39,{s:8,al:'r',c:C.li2,w:150})}
  p.t(d.data||p.meta.data||'',p.W-p.M,h-19,{s:8,c:C.li2,al:'r',w:p.CW});p.y=h+20;
 }
 if(typeof RP_COR!=='undefined')Object.assign(RP_COR,PDF);
 if(typeof rpNovo==='function'){
  const original=rpNovo;
  rpNovo=async function(lib,meta){
   const p=await original(lib,{...meta,demo:!!meta?.demo||!!root.DIARIO_DEMO});
   for(const [key,value]of Object.entries(PDF))p.C[key]=p.hex(value);
   // Relatórios usam a mesma família; as fontes continuam incorporadas e selecionáveis.
   p.F.serif=p.F.b;p.F.serifItalic=p.F.i;
   const save=p.doc.save.bind(p.doc);p.doc.save=async function(...args){footer(p);return save(...args)};
   return p;
  };
 }
 if(typeof rpCapa==='function')rpCapa=cover;
 // A paleta atua apenas enquanto o renderizador legado está exportando.
 if(typeof imgdPal!=='undefined')Object.assign(imgdPal,{pag:IMAGE.bg,card:IMAGE.card,esc:IMAGE.raised,linha:IMAGE.line,tx:IMAGE.tx,tx2:IMAGE.mut,g:IMAGE.g,r:IMAGE.r,am:IMAGE.am});
 if(typeof IMG_FOLGA!=='undefined'){IMG_FOLGA.top=64;IMG_FOLGA.bot=72}
 // A fotografia decorativa deixa de ocupar os cabeçalhos dos compartilhamentos.
 if(typeof imgdTouro==='function')imgdTouro=function(){};
 function text(ctx,value,x,y,size=26,color=IMAGE.tx,weight=500,align='left',max){ctx.font=weight+' '+size+'px '+stack;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';let label=String(value??'');if(max&&ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…'}ctx.fillText(label,x,y)}
 function box(ctx,x,y,w,h){ctx.fillStyle=IMAGE.card;ctx.strokeStyle=IMAGE.line;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill();ctx.stroke()}
 function line(ctx,y,w){ctx.fillStyle=IMAGE.line;ctx.fillRect(56,y,w-112,1)}
 function heading(ctx,w,title,sub){
  text(ctx,'DIÁRIO DE TRADER',56,62,23,IMAGE.ac,700);
  text(ctx,title,56,124,42,IMAGE.tx,700,'left',w-112);
  if(sub)text(ctx,sub,56,166,23,IMAGE.mut,400,'left',w-112);
  line(ctx,196,w);
 }
 function end(ctx,w,h,left,right='Registro pessoal'){
  if(root.DIARIO_DEMO)right='DEMONSTRAÇÃO / DADOS FICTÍCIOS';
  line(ctx,h-104,w);text(ctx,left,56,h-67,20,IMAGE.mut,400,'left',w-112);
  text(ctx,'DIÁRIO DE TRADER',56,h-30,19,IMAGE.ac,650);text(ctx,right,w-56,h-30,19,IMAGE.mut,400,'right',w-410);
 }
 function row(ctx,w,y,label,value,color=IMAGE.tx){text(ctx,label,80,y,25,IMAGE.mut);text(ctx,value,w-80,y,29,color,650,'right',w*.5);line(ctx,y+26,w)}
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,h);return {c,ctx}}
 function panoramaHeader(c){
  const ctx=c.getContext('2d'),w=c.width,top=c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0,h=top+150;
  ctx.save();ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,h);text(ctx,root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER / MERCADO',48,42,22,IMAGE.ac,700);text(ctx,'Panorama do mercado',48,96,42,IMAGE.tx,700);
  const dt=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  text(ctx,dt+' · Brasília',48,139,23,IMAGE.mut);
  const bias=typeof MDO!=='undefined'&&MDO.v?.mercados?.pre?.vies;
  if(bias){const label='Viés '+bias,x=w-300;box(ctx,x,111,252,43);text(ctx,label,x+126,140,23,bias==='positivo'?IMAGE.g:bias==='negativo'?IMAGE.r:IMAGE.am,650,'center',224)}
  ctx.fillStyle=IMAGE.line;ctx.fillRect(48,h-1,w-96,1);ctx.restore();
 }
 async function blob(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Não foi possível criar a imagem.')),'image/png'))}
 function tradeCanvas(t){
  const data=shrDados(t),mode=typeof SHR!=='undefined'&&SHR.modo||'preco',value=shrPct(t,data,mode),color=finite(value)?value>=0?IMAGE.g:IMAGE.r:IMAGE.mut;
  const {c,ctx}=canvas(1080,1350),date=String(t.dt||'').replace('T',' ').slice(0,16);
  heading(ctx,1080,'Registro da operação',[data.tp,data.lado,date].filter(Boolean).join(' · '));
  text(ctx,String(t.ativo||t.tk||'Ativo não informado'),56,282,48,IMAGE.tx,700,'left',968);
  text(ctx,data.op?'EM ANDAMENTO · VALOR DE REFERÊNCIA':'OPERAÇÃO ENCERRADA',56,326,22,IMAGE.mut,600);
  box(ctx,56,366,968,218);text(ctx,pc(value),80,476,88,color,700,'left',910);
  text(ctx,mode==='conta'?'Variação sobre a conta':'Variação do preço a favor da operação',80,540,25,IMAGE.mut);
  const price=v=>{const n=typeof numN==='function'?numN(v):typeof v==='number'?v:Number(String(v??'').replace(',','.'));return v!==null&&v!==undefined&&v!==''&&Number.isFinite(n)?num(n,Math.abs(n)>=10000?0:2):'—'};
  row(ctx,1080,660,'Entrada informada',price(t.entry));
  row(ctx,1080,750,data.op?'Referência disponível':'Saída informada',price(data.op?data.px:t.exit));
  row(ctx,1080,930,'Setup',t.setup||'Não informado');
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.c?.pl))row(ctx,1080,1020,'Resultado financeiro',typeof mT==='function'?mT(t,data.c.pl):num(data.c.pl),data.c.pl>=0?IMAGE.g:IMAGE.r);
  text(ctx,'Dados da operação registrados no diário.',56,1140,22,IMAGE.mut,400,'left',968);
  end(ctx,1080,1350,data.op?'Operação aberta: valores podem mudar.':'Resultado individual; não representa o desempenho da conta.');return c;
 }
 function periodCanvas(data){
  const {c,ctx}=canvas(1080,1080);heading(ctx,1080,data.tit||'Resumo do período',data.sub||'Período não informado');
  box(ctx,56,236,968,214);text(ctx,pc(data.pct),80,350,86,finite(data.pct)?data.pct>=0?IMAGE.g:IMAGE.r:IMAGE.mut,700,'left',910);text(ctx,'Resultado sobre o capital de referência cadastrado',80,408,24,IMAGE.mut,400,'left',920);
  row(ctx,1080,528,'Operações encerradas',finite(data.M?.n)?String(data.M.n):'—');
  row(ctx,1080,620,'Acerto',finite(data.M?.acerto)?num(data.M.acerto*100,1)+'%':'—');
  const best=data.best?.t?.ativo||'—';
  row(ctx,1080,804,'Melhor trade',best);
  row(ctx,1080,892,'Regras seguidas',finite(data.seq)?data.seq+' dia(s) seguidos':'—');
  end(ctx,1080,1080,'Amostra pessoal do diário; registros e capital determinam o cálculo.');return c;
 }
 if(typeof shrGera==='function')shrGera=async t=>blob(tradeCanvas(t));
 if(typeof shrGeraPer==='function')shrGeraPer=async d=>blob(periodCanvas(d));
 function compactPanorama(source,contentEnd){
  const height=Math.ceil(contentEnd+124),foot=84;if(height>=source.height||height<400)return source;
  const result=document.createElement('canvas');result.width=source.width;result.height=height;const ctx=result.getContext('2d');
  ctx.drawImage(source,0,0,source.width,height-foot,0,0,source.width,height-foot);
  ctx.drawImage(source,0,source.height-foot,source.width,foot,0,height-foot,source.width,foot);return result;
 }
 function jsPdf(doc,meta={}){
  const count=doc.internal.getNumberOfPages(),w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
  for(let i=1;i<=count;i++){
   doc.setPage(i);doc.setFillColor(255,255,255);doc.rect(0,0,w,11,'F');doc.rect(0,h-12,w,12,'F');
   doc.setFont('helvetica','bold');doc.setFontSize(7.5);doc.setTextColor(8,124,85);doc.text('DIÁRIO DE TRADER',14,7);
   doc.setDrawColor(216,225,233);doc.line(14,10,w-14,10);doc.line(14,h-12,w-14,h-12);
   doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(83,101,117);
   doc.text(root.DIARIO_DEMO?'DEMONSTRAÇÃO / DADOS FICTÍCIOS':'Uso pessoal - '+String(meta.tt||'Relatório').slice(0,65),14,h-6);
   doc.text(i+' / '+count,w-14,h-6,{align:'right'});
  }
 }
 function frame(source,title){
  if(!source?.getContext)return source;const w=source.width,h=source.height,{c,ctx}=canvas(w,h+174);
  ctx.drawImage(source,0,96);text(ctx,'DIÁRIO DE TRADER',32,37,21,IMAGE.ac,700);text(ctx,title,32,72,26,IMAGE.tx,650,'left',w-64);ctx.fillStyle=IMAGE.line;ctx.fillRect(32,94,w-64,1);
  text(ctx,'Registro pessoal - dados e filtros da tela',32,c.height-35,20,IMAGE.mut,400,'left',w-64);return c;
 }
 function legacyHeader(c,kind,data){
  if(!c?.getContext)return c;const ctx=c.getContext('2d'),w=c.width,top=c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0;
  const height=top+(kind==='giro'?140:150),title=kind==='ranking'?'Altas e baixas da B3':kind==='giro'?'Giro do mercado':'Jornal do Pregão';
  const raw=data?.gerado||data?.dia;const date=raw?new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00-03:00':raw):new Date();
  const stamp=Number.isFinite(date.getTime())?date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',...(kind==='jornal'?{}:{hour:'2-digit',minute:'2-digit'})}):'não informada';
  ctx.save();ctx.fillStyle=IMAGE.bg;ctx.fillRect(0,0,w,height);
  const label=root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER';
  text(ctx,label,48,45,22,IMAGE.ac,700);text(ctx,title,48,104,42,IMAGE.tx,700,'left',w-96);text(ctx,(raw?'Referência: ':'Captura: ')+stamp,48,150,23,IMAGE.mut,400,'left',w-96);
  ctx.fillStyle=IMAGE.line;ctx.fillRect(48,height-1,w-96,1);ctx.restore();return c;
 }
 if(typeof rkDesenha==='function'){const draw=rkDesenha;rkDesenha=function(data){return legacyHeader(draw.apply(this,arguments),'ranking',data)}}
 if(typeof grDesenha==='function'){const draw=grDesenha;grDesenha=function(data){return legacyHeader(draw.apply(this,arguments),'giro',data)}}
 if(typeof jrImagem==='function'){const draw=jrImagem;jrImagem=function(){return legacyHeader(draw.apply(this,arguments),'jornal',typeof jrVer==='function'?jrVer():null)}}
 root.TraderExportBrand=Object.freeze({PDF,IMAGE,footer,cover,panoramaHeader,tradeCanvas,periodCanvas,jsPdf,frame,compactPanorama,legacyHeader});
})(window);
