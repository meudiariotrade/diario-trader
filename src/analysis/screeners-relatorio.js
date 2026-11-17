/* Dossiê de 1 a 10 ações. Reutiliza a biblioteca e as fontes PDF já instaladas no app. */
(function(w){
'use strict';
const intelligence=()=>w.DiarioScreenersInteligencia;
const colors={ink:'#1f2023',gold:'#ac8439',paper:'#fbfaf7',panel:'#efeeeb',muted:'#626770',rule:'#dcdad5',white:'#ffffff',green:'#24734c',red:'#ad4440'};
const num=(v,d=1)=>v===null||v===undefined||!Number.isFinite(Number(v))?'N/D':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const date=t=>{if(!t)return 'não informada';const d=new Date(t);return Number.isFinite(d.valueOf())?d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):String(t).slice(0,10)};
async function libs(){
 const load=file=>w.DiarioChunks?.load?w.DiarioChunks.load(file):new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=file;s.onload=resolve;s.onerror=()=>reject(Error('Biblioteca não disponível: '+file));document.head.appendChild(s)});
 if(!w.PDFLib)await load('pdf-lib.min.js');
 if(!w.fontkit)await load('fontkit.umd.min.js');
 if(!w.PDFLib||!w.fontkit)throw Error('Motor PDF indisponível.');
 return w.PDFLib;
}
function drawing(doc,P,font){
 const W=595.28,H=841.89,M=43,CW=W-2*M;
 const C=Object.fromEntries(Object.entries(colors).map(([k,h])=>{const n=parseInt(h.slice(1),16);return [k,P.rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)]}));
 let pg=null,y=0;
 const text=s=>String(s??'').replace(/\s+/g,' ').trim();
 function rectangle(x,t,width,height,color){pg.drawRectangle({x,y:H-t-height,width,height,color})}
 function line(x,t,x2,t2,color=C.rule){pg.drawLine({start:{x,y:H-t},end:{x:x2,y:H-t2},thickness:.7,color})}
 function write(s,x,t,opt={}){
  const f=opt.font==='bold'?font.bold:opt.font==='serif'?font.serif:font.sans,sz=opt.size||9,raw=text(s);
  const width=f.widthOfTextAtSize(raw,sz),left=opt.right?x-width:x;
  pg.drawText(raw,{x:left,y:H-t-sz,size:sz,font:f,color:opt.color||C.ink});
 }
 function wrap(s,x,t,maxW,opt={}){
  const f=opt.font==='bold'?font.bold:opt.font==='serif'?font.serif:font.sans,sz=opt.size||9,lead=opt.leading||sz*1.4,words=text(s).split(' ');
  let acc='',lines=[];for(let word of words){
   if(f.widthOfTextAtSize((acc?acc+' ':'')+word,sz)>maxW){
    if(acc)lines.push(acc);acc='';
    while(f.widthOfTextAtSize(word,sz)>maxW&&word.length>1){let n=word.length-1;while(n>1&&f.widthOfTextAtSize(word.slice(0,n),sz)>maxW)n--;lines.push(word.slice(0,n));word=word.slice(n)}
   }
   acc=acc?acc+' '+word:word;
  }if(acc)lines.push(acc);
  for(const l of lines.slice(0,opt.maxLines||100)){write(l,x,t,opt);t+=lead}return t;
 }
 function page(title,subtitle,cover=false){
  pg=doc.addPage([W,H]);rectangle(0,0,W,cover?220:65,C.ink);
  write('DIÁRIO DE TRADER',M,19,{font:'bold',size:9,color:C.gold});
  write('ANÁLISES  /  SCREENERS',W-M,19,{size:8,color:C.white,right:true});
  rectangle(M,cover?191:61,42,3,C.gold);
  if(cover){write('Dossiê de ações',M,78,{font:'serif',size:29,color:C.white});wrap(title,M,122,CW,{font:'bold',size:16,color:C.gold});wrap(subtitle,M,158,CW,{size:10,color:C.white});y=243}
  else{const endTitle=wrap(title,M,82,CW,{font:'serif',size:16,leading:19,maxLines:2});const endSub=wrap(subtitle,M,Math.max(114,endTitle+7),CW,{size:9,color:C.muted,maxLines:2});y=Math.max(154,endSub+19)}
 }
 function footer(){
  const n=doc.getPageCount();line(M,793,W-M,793);
  write('Diário de Trader  •  Estudo educacional, não recomendação de investimento',M,805,{size:7,color:C.muted});
  write(String(n).padStart(2,'0'),W-M,805,{size:8,color:C.muted,right:true});
 }
 function bar(title,value,max=100){
  write(title,M,y,{size:8.7,color:C.muted});write(value==null?'N/D':num(value,1)+' / '+num(max,0),W-M,y,{font:'bold',size:8.7,right:true});
  rectangle(M,y+17,CW,4,C.rule);if(value!=null)rectangle(M,y+17,CW*Math.max(0,Math.min(1,value/max)),4,C.gold);y+=29;
 }
 return {W,H,M,C,CW,page,footer,rectangle,write,wrap,bar,line,get y(){return y},set y(t){y=t}};
}
function cover(L,market,rows,studies,opts={}){
 const scored=studies.filter(x=>x.score!==null).length,verified=studies.filter(x=>x.validated).length;
 L.page(market==='BR'?'Brasil  |  B3':'Estados Unidos  |  NYSE e NASDAQ', (opts.automatic?'Top '+rows.length+' automático  •  ':'')+rows.length+' empresas  •  '+scored+' com score  •  '+verified+' com cálculo conferido',true);
 L.write(opts.automatic?'RANKING AUTOMÁTICO — NOTAS DE 0 A 10':'RESUMO DA SELEÇÃO',L.M,L.y,{font:'bold',size:10,color:L.C.gold});L.y+=27;
 L.y=L.wrap('Este material mostra as empresas com melhor pontuação quantitativa calculável, os fatores que elevaram suas notas e os riscos a conferir. A nota de 0 a 10 vem do score de 0 a 100 dividido por dez. Score alto não garante preço atrativo nem retorno futuro.',L.M,L.y,L.CW,{size:9.8,leading:15})+22;
 L.rectangle(L.M,L.y,L.CW,25,L.C.ink);
 const heads=[['TICKER',L.M+8],['EMPRESA',L.M+90],['NOTA',L.M+325],['COB.',L.M+397],['STATUS',L.M+447]];
 heads.forEach(([s,x])=>L.write(s,x,L.y+7,{font:'bold',size:7,color:L.C.white}));L.y+=25;
 rows.forEach((r,i)=>{const s=studies[i];L.rectangle(L.M,L.y,L.CW,33,i%2?L.C.paper:L.C.panel);
  L.write((opts.automatic?String(i+1).padStart(2,'0')+'  ':'')+r.ticker,L.M+8,L.y+10,{font:'bold',size:8.5});
  L.wrap(r.empresa||r.company_name||r.ticker,L.M+90,L.y+10,226,{size:8,maxLines:1});
  L.write(s.score===null?'N/D':num((opts.automatic?s.modelScore:s.score)/10,1)+'/10',L.M+325,L.y+10,{size:8});
  L.write(num(s.coverage,0)+'%',L.M+397,L.y+10,{size:8});
  L.write(s.validated?'Fórmula OK':'Revisar',L.M+447,L.y+10,{size:7.5,color:s.validated?L.C.green:L.C.red});
  L.y+=33;
 });
 L.y+=23;L.y=L.wrap('Critério: pontuações verificadas contra os pesos do método. Ausência de indicadores e divergência na fórmula exigem revisão. Leia as análises individuais e as fontes antes de tomar qualquer decisão.',L.M,L.y,L.CW,{size:8,color:L.C.muted,leading:11});L.footer();
}
function individual(L,m,row,st,i,total,opts={}){
 const title=String(i+1).padStart(2,'0')+' / '+String(total).padStart(2,'0')+'  '+row.ticker+'  —  '+st.company;
 L.page(title,(row.setor||row.sector||'Setor não informado')+'  |  Snapshot: '+date(row.updated_at));
 L.write(opts.automatic?'NOTA NO RANKING AUTOMÁTICO':'NOTA QUANTITATIVA',L.M,L.y,{font:'bold',size:9,color:L.C.gold});
 L.write(st.score===null?'INCOMPLETO':num((opts.automatic?st.modelScore:st.score)/10,1)+' / 10',L.M,L.y+21,{font:'serif',size:22});
 L.write(st.level.toUpperCase(),L.W-L.M,L.y+27,{font:'bold',size:9,right:true,color:st.validated?L.C.green:L.C.red});L.y+=67;
 L.rectangle(L.M,L.y,L.CW,58,L.C.panel);L.y=L.wrap(st.profile||st.interpretation,L.M+12,L.y+11,L.CW-24,{size:9,leading:13,maxLines:3})+26;
 L.write('POR QUE A EMPRESA RECEBEU ESTA PONTUAÇÃO',L.M,L.y,{font:'bold',size:9.5,color:L.C.gold});L.y+=24;
 st.parts.forEach(g=>{
  L.bar(g.name+'  ('+g.weight+'% de peso)',g.points==null?null:g.points/10,g.weight/10);
  const metrics=g.metrics.filter(x=>x.number!=null).map(x=>x.label+': '+num(x.number,1)+(x.unit==='%'?'%':x.unit==='x'?'x':''));
  if(!metrics.length){L.write('Não há dados suficientes para este critério.',L.M+3,L.y,{size:8,color:L.C.red});L.y+=17}
  else L.y=L.wrap(metrics.join('   •   '),L.M+3,L.y,L.CW-6,{size:8,color:L.C.muted,leading:11,maxLines:2})+12;
 });
 L.y+=5;L.write('PONTOS POSITIVOS OBSERVADOS',L.M,L.y,{font:'bold',size:9,color:L.C.green});L.y+=16;
 for(const v of (st.positives.length?st.positives:['Dados insuficientes para sustentar uma tese positiva.']).slice(0,2)){L.y=L.wrap('• '+v,L.M,L.y,L.CW,{size:8.5,leading:12,maxLines:2})+4}
 L.y+=6;L.write('ALERTAS / LACUNAS PARA CONFERIR',L.M,L.y,{font:'bold',size:9,color:L.C.red});L.y+=16;
 for(const v of (st.risks.length?st.risks:['Validar preço, demonstrações, riscos e premissas do setor.']).slice(0,3)){L.y=L.wrap('• '+v,L.M,L.y,L.CW,{size:8.3,leading:12,maxLines:2})+4}
 L.y+=10;L.line(L.M,L.y,L.W-L.M,L.y);L.y+=8;
 L.y=L.wrap('FONTES: '+st.sources.join(', ')+'. Competência do balanço: '+date(st.competence)+'. Coleta: '+date(st.fundamentals_at)+'. Técnico: '+date(st.technical_at)+'. Cobertura: '+num(st.coverage,0)+'%.',L.M,L.y,L.CW,{size:7.7,color:L.C.muted,leading:11,maxLines:3});L.footer();
}
function methodology(L,m,opts={}){
 L.page('Como o score é calculado','Metodologia, validação, premissas e limitações');
 L.write('PESOS DO MODELO',L.M,L.y,{font:'bold',size:9,color:L.C.gold});L.y+=23;
 for(const g of intelligence().weights[m])L.bar(g.name,g.weight);
 L.y+=22;
 if(opts.automatic){
  L.write('CRITÉRIOS DO TOP 10 AUTOMÁTICO',L.M,L.y,{font:'bold',size:9,color:L.C.gold});L.y+=18;
  L.y=L.wrap(opts.method||'Notas conferidas. Liquidez, datas e qualidade de indicadores verificadas.',L.M,L.y,L.CW,{size:8.6,leading:12})+15;
 }
 for(const p of [
  'Cada métrica disponível é normalizada numa escala interna de 0 a 100. Dentro de cada grupo, o modelo usa a média das métricas presentes. A contribuição do grupo é essa média multiplicada pelo peso da categoria; o score total é a soma das quatro contribuições.',
  'A validação de fórmula exige consistência da pontuação salva com o cálculo, cobertura adequada e datas recentes; não substitui uma auditoria independente das fontes. Valores ausentes nunca são substituídos por números inventados; se faltar uma categoria inteira, não se deve interpretar o resultado como score completo.',
  'A comparação entre setores requer cuidado: bancos, seguradoras, empresas cíclicas e negócios sem lucro podem não ser adequadamente representados por todos os múltiplos. As notas são um filtro, não um valuation ou preço-alvo.',
  'Para discutir se compensa comprar, verificar as demonstrações e notas, eventos extraordinários, concorrentes do mesmo setor, governança, dívida, valuation, preço atual, liquidez, cenário e tolerância pessoal ao risco.',
  'Este PDF usa somente o snapshot disponível na aba Análises. Nenhuma consulta de cotações é feita ao exportar. Acompanhe as datas em cada página e confira cada informação diretamente na fonte.'
 ]){L.y=L.wrap(p,L.M,L.y,L.CW,{size:9.2,leading:14})+19}
 L.footer();
}
async function build(m,rows,opts={}){
 if(!['BR','US'].includes(m)||!Array.isArray(rows)||rows.length<1||rows.length>10)throw Error('Selecione de 1 a 10 ações de um mesmo mercado.');
 if(new Set(rows.map(x=>x?.ticker)).size!==rows.length)throw Error('A seleção contém tickers repetidos.');
 if(!intelligence())throw Error('Validador de indicadores indisponível.');
 const P=await libs(),doc=await P.PDFDocument.create();
 doc.setTitle((opts.automatic?'Top 10 automático':'Dossiê de ações')+' '+m+' - Diário de Trader');doc.setAuthor('Diário de Trader');
 doc.registerFontkit(w.fontkit);
 const loaded=await Promise.all(['pdf-sans.ttf','pdf-sans-bold.ttf','pdf-serif-bold.ttf'].map(async name=>{
  const r=await fetch(name,{cache:'force-cache'});if(!r.ok)throw Error('Fonte PDF indisponível: '+name);
  return doc.embedFont(new Uint8Array(await r.arrayBuffer()),{subset:true});
 }));
 const L=drawing(doc,P,{sans:loaded[0],bold:loaded[1],serif:loaded[2]});
 const studies=rows.map(r=>intelligence().diagnostics(m,r,Date.now(),opts.medians||null));
 cover(L,m,rows,studies,opts);rows.forEach((r,i)=>individual(L,m,r,studies[i],i,rows.length,opts));methodology(L,m,opts);
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:(opts.automatic?'Top10-Quantitativo-':'Dossie-')+m+'-'+new Date().toISOString().slice(0,10)+'-'+rows.length+'-acoes.pdf',pages:doc.getPageCount()};
}
async function share(m,rows,opts={}){
 const pdf=await build(m,rows,opts);
 if(navigator.canShare&&navigator.share&&typeof File==='function'){
  const file=new File([pdf.blob],pdf.name,{type:'application/pdf'});
  if(navigator.canShare({files:[file]}))try{await navigator.share({title:'Dossiê de ações — Diário de Trader',files:[file]});return {shared:true,pages:pdf.pages}}catch(e){if(e?.name==='AbortError')return {cancelled:true}}
 }
 const url=URL.createObjectURL(pdf.blob),a=document.createElement('a');
 a.href=url;a.download=pdf.name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);return {downloaded:true,pages:pdf.pages};
}
w.DiarioScreenersRelatorio={build,share};
})(window);
