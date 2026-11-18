/* Pesquisa: exportação PDF local, sem alterar os relatórios editoriais existentes. */
(function(w){'use strict';
// Gráfico editorial de Pesquisa: usa exclusivamente os 90 candles já coletados pelo backend.
// Preços teóricos são referências horizontais condicionais, NUNCA candles futuros ou previsões certas.
function graficoPDF(asset){
 const c=asset?.candles;
 if(!Array.isArray(c)||c.length!==90||!c.every((x,i)=>Array.isArray(x)&&x.length>=6&&
  x.every(Number.isFinite)&&x[0]>0&&x[1]>0&&x[3]>0&&x[4]>0&&
  x[2]>=Math.max(x[1],x[3],x[4])&&x[3]<=Math.min(x[1],x[4])&&x[5]>=0&&
  (!i||x[0]>c[i-1][0])))return null;
 if(!asset.fonte||!asset.as_of||Date.parse(asset.as_of)>Date.now()+3600000)return null;
 const canvas=document.createElement('canvas');canvas.width=1320;canvas.height=720;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const W=canvas.width,H=canvas.height,L=85,R=135,T=85,B=70,plotRight=W-R,plotBottom=H-B;
 ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
 const text=(v,x,y,size=18,color='#111827',align='left')=>{ctx.fillStyle=color;ctx.textAlign=align;ctx.font=size+'px Arial';ctx.fillText(String(v),x,y)};
 text(String(asset.ticker).slice(0,12)+' · 90 candles diários · REFERÊNCIAS NÃO PREDITIVAS',L,38,22);
 text('Dados: '+String(asset.as_of).slice(0,10),plotRight,38,16,'#64748B','right');
 const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
 const refs=[['Último fechamento',asset.referencias?.preco,'#1D4ED8'],
  ['Graham',asset.referencias?.graham,'#9333EA'],['Bazin',asset.referencias?.bazin,'#D97706'],
  ['DCF',asset.referencias?.dcf,'#089981']].filter(x=>positive(x[1]));
 const prices=c.flatMap(x=>[x[2],x[3]]).concat(refs.map(x=>x[1]));
 const minPrice=Math.min(...prices),maxPrice=Math.max(...prices),pad=Math.max((maxPrice-minPrice)*.06,maxPrice*.005);
 const low=Math.max(.000001,minPrice-pad),high=maxPrice+pad;
 const y=v=>plotBottom-(v-low)/(high-low)*(plotBottom-T),x=i=>L+(i+.5)*(plotRight-L)/c.length;
 const axis=v=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:v<1?4:2});
 for(let j=0;j<=5;j++){const value=low+(high-low)*j/5,py=y(value);
  ctx.strokeStyle='#E5E7EB';ctx.lineWidth=1;ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(L,py);ctx.lineTo(plotRight,py);ctx.stroke();
  text(axis(value),plotRight+12,py+5,16,'#64748B');
 }
 for(let i=0;i<c.length;i++){const z=c[i],col=z[4]>=z[1]?'#089981':'#F23645',xx=x(i),bw=(plotRight-L)/c.length*.57;
  ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.beginPath();
  ctx.moveTo(xx,y(z[2]));ctx.lineTo(xx,y(z[3]));ctx.stroke();
  ctx.fillRect(xx-bw/2,Math.min(y(z[1]),y(z[4])),Math.max(3,bw),Math.max(2,Math.abs(y(z[1])-y(z[4]))));
 }
 for(const [name,price,color] of refs){
  const yy=y(price);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([10,8]);
  ctx.beginPath();ctx.moveTo(L,yy);ctx.lineTo(plotRight,yy);ctx.stroke();ctx.setLineDash([]);
  text(name+' '+axis(price),plotRight-8,Math.max(T+14,Math.min(plotBottom-6,yy-6)),17,color,'right');
 }
 for(const i of [0,30,60,89]){
  const date=new Date(c[i][0]*1000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  text(date,x(i),H-24,17,'#64748B','center');
 }
 return canvas.toDataURL('image/png');
}
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
 // Gráficos só existem quando o serviço forneceu séries verificáveis; sem gráfico fabricado.
 const charts=Array.isArray(r.graficos_pdf)?r.graficos_pdf.slice(0,5):[];
 for(const chart of charts){
  const png=graficoPDF(chart);if(!png)continue;
  const picture=await doc.embedPng(png);
  add();
  line('EVOLUÇÃO DO PREÇO E REFERÊNCIAS · '+String(chart.ticker||''),true);
  const width=W-2*M,height=width*720/1320;
  page.drawImage(picture,{x:M,y:y-height-6,width,height});
  y-=height+23;
  line('Candles observados: '+String(chart.fonte||'Fonte não confirmada'));
  line('Referências Graham/Bazin/DCF exibidas somente quando maiores que zero.');
  line('Linhas horizontais são estudos condicionais, nunca trajetória ou cotação futura.');
  if(chart.referencias?.dcf_motivo)line('DCF: '+String(chart.referencias.dcf_motivo).slice(0,210));
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
