/* Dossiê Técnico editorial v762: exportação 100% local, sem IA automática nem banco. */
(function(w){
'use strict'
async function hashSnapshot(input){
 if(!globalThis.crypto?.subtle)throw Error('SHA-256 indisponível: PDF sem rastreabilidade não é emitido');
 const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':
  x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':
  JSON.stringify(x===undefined?null:x);
 const bytes=new TextEncoder().encode(stable(input));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
;
const n=(v,d=1)=>v==null||!Number.isFinite(Number(v))?'N/D':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const C={dark:'#11141B',gold:'#D4A017',paper:'#FFFFFF',muted:'#647080',line:'#DDE1E5',green:'#117A57',red:'#BF3B40',ink:'#161A22'};
const color=(P,h)=>{const x=parseInt(h.slice(1),16);return P.rgb((x>>16&255)/255,(x>>8&255)/255,(x&255)/255)};
async function libs(){
 const load=file=>w.DiarioChunks?.load?w.DiarioChunks.load(file):new Promise((ok,no)=>{const el=document.createElement('script');el.src=file;el.onload=ok;el.onerror=()=>no(Error(file+' indisponível'));document.head.appendChild(el)});
 if(!w.PDFLib)await load('pdf-lib.min.js');
 if(!w.fontkit)await load('fontkit.umd.min.js');
 if(!w.PDFLib||!w.fontkit)throw Error('Motor editorial PDF indisponível');
 return w.PDFLib;
}
async function build(m,rows,tf='1d'){
 if(!['br','world'].includes(m)||!Array.isArray(rows)||rows.length!==10)
  throw Error('Dossiê PDF Top 10 exige exatamente 10 ativos concretos e validados');
 if(new Set(rows.map(r=>r?.ticker)).size!==10)throw Error('Ativos repetidos no Top 10');
 const samples=rows.map(r=>{
  const x=r.pdfSide==='sell'?r.sell:r.buy;
  const prices=['entry','stop','target1','target2a','target2','targetFinal'];
  if(!x?.valid||!x.eligible||x.barCount<250||x.flags?.length||!x.metrics?.obvConfirmed||
   !Number.isFinite(x.metrics?.rs)||!Number.isFinite(x.plan?.rr)||x.plan.rr<1.5||
   !prices.every(k=>positivo(x.plan[k])))throw Error('Ativo sem confirmação completa: '+String(r.ticker));
  const c=candlesPDF(r.chartCandles);
  if(Math.abs(c.at(-1).c-x.price)>Math.max(.01,Math.abs(x.price)*.001))
   throw Error('OHLCV diverge da nota técnica calculada: '+String(r.ticker));
  return c;
 });
 const hash=await hashSnapshot({tipo:'tecnico',m,tf,modelo:'tecnico-engine 762 / app v768',rows});
  const P=await libs(),doc=await P.PDFDocument.create();doc.registerFontkit(w.fontkit);
 const fonts=await Promise.all(['pdf-sans.ttf','pdf-sans-bold.ttf','pdf-serif-bold.ttf'].map(async f=>{const r=await fetch(f,{cache:'force-cache'});if(!r.ok)throw Error('Fonte do PDF indisponível: '+f);return doc.embedFont(new Uint8Array(await r.arrayBuffer()),{subset:true})}));
 const [reg,bold,serif]=fonts,W=595.28,H=841.89,M=43,col=Object.fromEntries(Object.entries(C).map(([k,v])=>[k,color(P,v)]));
 let page,y,pageCount=0;const LOGOS=await (w.DiarioPDFLogos?.carregar(doc,rows.map(r=>r.ticker))||new Map());const logo=(tk,x,top,sz)=>w.DiarioPDFLogos?.desenhar(page,LOGOS,tk,x,top,sz,H)||0;
 function rect(x,top,w,h,fill){page.drawRectangle({x,y:H-top-h,width:w,height:h,color:fill})}
 function write(text,x,top,size=9,font=reg,fill=col.ink,right=false){
  const value=String(text??'').replace(/[\r\n\t]+/g,' ').trim();if(!value)return;
  let v=value;while(v.length>1&&font.widthOfTextAtSize(v,size)>W-M-x+((right?x:0)))v=v.slice(0,-2)+'…';
  const measured=font.widthOfTextAtSize(v,size);
  page.drawText(v,{x:right?x-measured:x,y:H-top-size,font,size,color:fill});
 }
 function wrap(text,x,top,width,size=9,leading=13,font=reg,fill=col.ink,limit=12){
  const words=String(text??'').replace(/\s+/g,' ').trim().split(' ');let line='',printed=0;
  for(const word of words){const next=line?line+' '+word:word;
   if(font.widthOfTextAtSize(next,size)>width&&line){write(line,x,top,size,font,fill);top+=leading;printed++;line=word;if(printed>=limit)return top}
   else line=next;
  }if(line&&printed<limit){write(line,x,top,size,font,fill);top+=leading}
  return top;
 }
 function newPage(title,subtitle,cover=false){
  page=doc.addPage([W,H]);pageCount++;rect(0,0,W,cover?215:66,col.dark);
  write('DIÁRIO DE TRADER',M,18,9,bold,col.gold);write('ANÁLISES / TÉCNICO',W-M,18,8,reg,col.paper,true);
  rect(M,cover?204:63,52,2,col.gold);
  if(cover){write('Dossiê Técnico',M,85,29,serif,col.paper);write(title,M,130,15,bold,col.gold);y=252}
  else{write(title,M,86,17,serif,col.ink);y=116;y=wrap(subtitle,M,y,W-2*M,9,13,reg,col.muted,2)+23}
 }
 function bar(name,pct,weight){
  write(name,M,y,9,reg,col.muted);write(n(pct*weight/10,2)+' / '+n(weight/10,1),W-M,y,9,bold,col.ink,true);
  rect(M,y+17,W-2*M,5,col.line);rect(M,y+17,(W-2*M)*Math.max(0,Math.min(1,pct)),5,col.gold);y+=37;
 }
 function footer(){
  rect(M,791,W-2*M,.7,col.line);
  write('Diário de Trader · Estudo técnico',M,802,7,reg,col.muted);
  write(String(pageCount).padStart(2,'0'),W-M,802,8,reg,col.muted,true);
 }
 function comp(r){
  const x=r.pdfSide==='sell'?r.sell:r.buy;
  return {x,side:r.pdfSide==='sell'?'VENDA/SHORT':'COMPRA'};
 }
 function verified(x){
  if(!x?.valid||x.score==null||x.pillars?.length!==4)return false;
  const weights=x.pillars.map(p=>p.weight).reduce((a,b)=>a+b,0);
  const calc=x.pillars.reduce((a,p)=>a+p.score*p.weight/10,0);
  return weights===100&&Math.abs(calc-x.score)<=.11&&x.barCount>=210;
 }
 const region=m==='br'?'BRASIL / B3':'EUA & CRIPTO';
 newPage(region,region+' · '+rows.length+' ativos · '+tf,true);
 write('RANKING TÉCNICO  |  0 A 10',M,y,10,bold,col.gold);y+=31;
 y=wrap('Os ativos são ordenados pelos quatro pilares calculados sobre candles reais. Um número elevado não substitui a confirmação do preço, volume e risco. O Top automático exclui sinais esticados e sem confirmação de OBV.',M,y,W-2*M,10,15)+24;
 rect(M,y,W-2*M,27,col.dark);
 write('POS.',M+10,y+7,8,bold,col.paper);write('ATIVO',M+62,y+7,8,bold,col.paper);write('LADO',M+178,y+7,8,bold,col.paper);write('NOTA',M+327,y+7,8,bold,col.paper);write('CONFERÊNCIA',M+395,y+7,8,bold,col.paper);y+=27;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],s=comp(r),x=s.x;
  rect(M,y,W-2*M,33,i%2?col.paper:color(P,'#F3F4F5'));
  write(String(i+1).padStart(2,'0'),M+10,y+10,9,bold);
  logo(r.ticker,M+44,y+8,14);write(r.ticker,M+62,y+10,9,bold);write(s.side,M+178,y+10,8);
  write(n(x.score,1)+'/10',M+327,y+10,9,bold);
  write(verified(x)?'CONFERIDO':'REVISAR',M+395,y+10,7.4,bold,verified(x)?col.green:col.red);
  y+=33;
 }
 y+=29;y=wrap('Atualizado em '+new Date().toLocaleString('pt-BR')+' · Período: '+tf+'.',M,y,W-2*M,8,12,reg,col.muted,4);footer();
 for(let i=0;i<rows.length;i++){
  const r=rows[i],{x,side}=comp(r);newPage(String(i+1).padStart(2,'0')+' / '+String(rows.length).padStart(2,'0')+'   '+r.ticker+'   '+side,'Período '+tf+' · '+(r.updatedAt||'data indisponível'));
  logo(r.ticker,W-M-34,80,34);write('NOTA TÉCNICA',M,y,10,bold,col.gold);
  write(n(x.score,1)+' / 10',M,y+18,23,serif);
  write(verified(x)?'CONFERIDO':'EXIGE CONFERÊNCIA',W-M,y+28,9,bold,verified(x)?col.green:col.red,true);y+=76;
  rect(M,y,W-2*M,60,color(P,'#F2F3F4'));
  y=wrap('Tendência '+(x.metrics?.mtf===true?'MTF alinhada':x.metrics?.mtf===null?'MTF não verificável':'MTF divergente')+'. OBV '+(x.metrics?.obvSignal||'não confirmado')+'. Volume relativo '+n(x.metrics?.rvol,2)+'x. HV semanal '+n(x.metrics?.hvWeek)+'%.',M+11,y+10,W-2*M-22,9,13,reg,col.ink,3)+22;
  write('COMPOSIÇÃO DA NOTA',M,y,10,bold,col.gold);y+=28;
  for(const p of x.pillars)bar(p.name,p.score,p.weight);
  y+=10;write('PLANO CONDICIONAL · REFERÊNCIAS FIBONACCING',M,y,10,bold,col.gold);y+=24;
  const pl=x.plan||{};
  for(const [a,b] of [['Gatilho',pl.entry],['Stop técnico',pl.stop],['Alvo 1 · 111%',pl.target1],['Alvo 2 · 127,2%',pl.target2a],['Alvo 3 · 141,4%',pl.target2],['Alvo final · 161,8%',pl.targetFinal],['R/R bruto / líquido (est.)',n(pl.rr,2)+' / '+n(pl.rrNet,2)]]){
   write(a,M,y,9,reg,col.muted);write(typeof b==='string'?b:n(b,2),W-M,y,9,bold,col.ink,true);y+=21;
  }
  y+=9;write('SINAIS E INVALIDAÇÕES',M,y,10,bold,col.gold);y+=21;
  const flags=(x.flags||[]).join('; ')||'Nenhuma trava antiarmadilha disparada';
  y=wrap('Alertas: '+flags+'. Fibo Cluster: '+(x.fib?.cluster?'sim':'não')+'. RMC 4-Barras: '+(x.turn?.confirmed?'confirmada':'não confirmada')+'. CISD: '+(x.turn?.cisd?'confirmado':'pendente')+'.',M,y,W-2*M,9,13,reg,col.ink,3)+9;
  y=wrap('Elliott: '+(x.elliott?.label||'indeterminado')+'. '+(x.elliott?.reason||'Contagem não conclusiva')+'.',M,y,W-2*M,8,12,reg,col.muted,2);
  const bt=r.backtest?.setups||{},names={pisani:'Pisani',minervini:'Minervini',fibonaccing:'Fibo',elliott:'Elliott'};
  const hist=Object.entries(names).map(([k,label])=>{
   const v=bt[k];return label+': '+(v?.winRate==null?'amostra insuficiente':n(v.winRate,1)+'% acerto; E='+n(v.expectancyR,2)+'R');
  }).join(' · ');
  y=wrap('Histórico exploratório (custos estimados '+n(pl.costEstimateBps,0)+' bps): '+hist+'.',M,y+8,W-2*M,8,12,reg,col.muted,3);
  footer();
  for(const [kind,label] of [['trend','Tendência · Médias · OBV'],['fibo','Fibonaccing · Plano de Trade'],['elliott','Elliott · ZigZag e Pivôs']]){
   const graph=desenharGrafico(r,x,kind,tf,samples[i]);
   newPage(String(i+1).padStart(2,'0')+' / 10   '+r.ticker+'   '+label,
    'Período '+tf+' · Último candle: '+new Date(samples[i].at(-1).t).toLocaleString('pt-BR'));
   const png=await doc.embedPng(graph.png);
   const wChart=W-2*M,hChart=wChart*graph.height/graph.width;
   page.drawImage(png,{x:M,y:H-y-hChart,width:wChart,height:hChart});
   y+=hChart+25;
   write('LEITURA OBJETIVA / LIMITES',M,y,10,bold,col.gold);y+=22;
   y=wrap(descricaoGrafico(kind,r,x,samples[i],graph),M,y,W-2*M,9.5,15,reg,col.ink,12);
   footer();
  }
 }
 newPage('Metodologia e conferência','Regras, fórmulas, evidências e limites do modelo local');
 write('PESOS DA NOTA',M,y,10,bold,col.gold);y+=26;
 for(const [p,z] of [['Tendência & Estrutura',30],['Momentum / OBV / Força Relativa',30],['Volume & Fluxo',20],['Fibonaccing / Volatilidade / Risco',20]]){
  write(p,M,y,9);write(z+'%',W-M,y,9,bold,col.ink,true);y+=26;
 }
 y+=22;
 for(const [head,paragraph] of [
  ['DADOS / HISTÓRICO','Cálculos exclusivamente sobre candles fechados normalizados, descartando barras inconsistentes. Mínimo 210 candles e 100 candles com volume positivo. Timeframes intradiários são conferidos contra um período superior quando disponível.'],
  ['FIBONACCING · ESTRUTURA','Retração 23,6/38,2/50/61,8/76,4/78,6% e projeção simétrica separada 100/127,2/141,4/161,8% a partir do pivô C nos pavios reais. Ancoragem em ZigZag dominante de até 250 candles fechados, com dois candles posteriores de confirmação.'],
  ['MÉDIAS · FLUXO · ELLIOTT','MM20/50/150/200 diárias, MM10/40 semanais, OBV, volume relativo, volatilidade semanal, VCP e fractalidade Mensal/Semanal/Diário. Elliott é hipótese de contagem com cenário alternativo ou indefinição explícita.'],
  ['CONFERÊNCIA / ANTIARMADILHA','Selo atesta soma ponderada dos quatro pilares, 100% de pesos e histórico mínimo de candles fechados. O ranking bloqueia sinais esticados, falta de volume ou OBV não confirmado.'],
  ['ESCOPO DO ESTUDO','Leitura técnica condicional gerada localmente sobre candles fechados. Liquidez, custos, ajustes corporativos e gestão de risco devem ser conferidos antes de qualquer decisão.']
 ]){
  write(head,M,y,8.5,bold,col.gold);y+=16;y=wrap(paragraph,M,y,W-2*M,8.5,12,reg,col.ink,7)+12;
 }
 footer();
 if(w.DiarioFiboVisual?.appendPDF)await w.DiarioFiboVisual.appendPDF({doc,P,tickers:rows.map(r=>r.ticker)});
 doc.setTitle('Dossiê Técnico '+region+' · Diário de Trader');doc.setAuthor('Diário de Trader');
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Dossie-Tecnico-'+(m==='br'?'Brasil':'EUA-Cripto')+'-'+new Date().toISOString().slice(0,10)+'.pdf',pages:doc.getPageCount()};
}

// Gráficos editoriais criados somente a partir do OHLCV já validado e armazenado no aparelho.
// Aparência gráfica inspirada na legibilidade de terminais profissionais; sem logotipo, embed ou dados do TradingView.
function candlesPDF(raw){
 if(!Array.isArray(raw)||raw.length<250)throw Error('PDF técnico exige >=250 candles reais para SMA 200 e 90 barras visíveis');
 const candles=[];
 for(const v of raw){
  const a=Array.isArray(v),t=Number(a?v[0]:v?.t??v?.time??v?.timestamp);
  const c={t:t<1e11?t*1000:t,o:Number(a?v[1]:v?.o??v?.open),h:Number(a?v[2]:v?.h??v?.high),
   l:Number(a?v[3]:v?.l??v?.low),c:Number(a?v[4]:v?.c??v?.close),v:Number(a?v[5]:v?.v??v?.volume)};
  if(!Object.values(c).every(Number.isFinite)||c.t<=0||c.o<=0||c.l<=0||c.c<=0||
    c.h<Math.max(c.o,c.c,c.l)||c.l>Math.min(c.o,c.c)||c.v<0)
    throw Error('OHLCV inválido: não desenhar gráfico com candles artificiais');
  if(candles.length&&c.t<=candles.at(-1).t)throw Error('OHLCV sem ordem temporal única');
  candles.push(c);
 }
 if(candles.filter(x=>x.v>0).length<100)throw Error('OHLCV sem volume confirmado');
 return candles;
}
const positivo=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
function swingsPDF(c){
 const points=[];for(let i=2;i<c.length-2;i++){
  const high=[i-2,i-1,i+1,i+2].every(j=>c[i].h>c[j].h);
  const low=[i-2,i-1,i+1,i+2].every(j=>c[i].l<c[j].l);
  for(const [hit,d,p] of [[high,1,c[i].h],[low,-1,c[i].l]]){
   if(!hit)continue;
   const last=points.at(-1);
   if(last?.d===d){if(d===1?p>last.p:p<last.p)points[points.length-1]={i,d,p}}
   else points.push({i,d,p});
  }
 }
 return points;
}
function desenharGrafico(r,x,kind,tf,candles){
 const view=candles.slice(-90),offset=candles.length-view.length,canvas=document.createElement('canvas');
 canvas.width=1600;canvas.height=1000;const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Canvas 2D indisponível no iPhone para produzir gráfico PDF');
 const W=canvas.width,H=canvas.height,L=82,R=226,T=82,B=74;
 const right=W-R,volTop=kind==='trend'?685:0,chartBottom=kind==='trend'?650:H-B;
 const chartH=chartBottom-T;const plotW=right-L;
 const fg='#111827',muted='#64748B',grid='#E5E7EB',rise='#089981',fall='#F23645';
 const axisLabel=(v)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:Math.abs(v)<2?4:2});
 const candlesX=i=>L+(i+.5)*plotW/view.length;
 const ctxText=(value,x,y,size=18,color=fg,align='left')=>{
  ctx.fillStyle=color;ctx.textAlign=align;ctx.font=size+'px Arial, sans-serif';ctx.fillText(String(value),x,y);
 };
 const f=(y,a,b,min,max)=>b-(y-min)/(max-min)*(b-a);
 ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
 ctxText(r.ticker+' · '+tf.toUpperCase()+' · '+(kind==='trend'?'MÉDIAS E FLUXO':
  kind==='fibo'?'FIBONACCING E PLANO':'PIVÔS E ELLIOTT'),L,33,23);
 ctxText('Último fechamento: '+new Date(view.at(-1).t).toLocaleDateString('pt-BR'),right,34,15,muted,'right');
 const side=r.pdfSide==='sell'?'sell':'buy';
 const additions=[];
 const fibLevels=Array.isArray(x.fib?.levels)?x.fib.levels.filter(z=>positivo(z.price)):[];
 const plan=x.plan||{};
 if(kind==='fibo'){
  additions.push(...fibLevels.map(z=>z.price));
  for(const key of ['entry','stop','target1','target2a','target2','targetFinal'])if(positivo(plan[key]))additions.push(plan[key]);
 }
 if(kind==='elliott'){const z=swingsPDF(candles);additions.push(...z.slice(-6).map(p=>p.p).filter(positivo))}
 const prices=view.flatMap(c=>[c.h,c.l]).concat(additions);
 const minPrice=Math.max(0.000001,Math.min(...prices)),maxPrice=Math.max(...prices);
 const margin=Math.max((maxPrice-minPrice)*.07,maxPrice*.005,0.000001);
 const lo=Math.max(0.000001,minPrice-margin),hi=maxPrice+margin;
 const py=v=>f(v,T,chartBottom,lo,hi);
 for(let z=0;z<=5;z++){
  const value=lo+(hi-lo)*(5-z)/5,y=py(value);
  ctx.strokeStyle=grid;ctx.lineWidth=1;ctx.setLineDash([]);ctx.beginPath();
  ctx.moveTo(L,y);ctx.lineTo(right,y);ctx.stroke();
  if(kind!=='fibo')ctxText(axisLabel(value),right+12,y+5,16,muted);
 }
 ctx.strokeStyle='#94A3B8';ctx.beginPath();ctx.moveTo(right,T);ctx.lineTo(right,chartBottom);ctx.stroke();
 for(let i=0;i<view.length;i++){
  const c=view[i],xv=candlesX(i),col=c.c>=c.o?rise:fall,bw=Math.max(3,plotW/view.length*.57);
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1.9;ctx.beginPath();
  ctx.moveTo(xv,py(c.h));ctx.lineTo(xv,py(c.l));ctx.stroke();
  ctx.fillRect(xv-bw/2,Math.min(py(c.o),py(c.c)),bw,Math.max(2,Math.abs(py(c.c)-py(c.o))));
 }
 function trace(points,color,width=2,dash=[]){
  if(points.length<2)return;
  ctx.beginPath();ctx.lineWidth=width;ctx.strokeStyle=color;ctx.setLineDash(dash);
  for(let i=0;i<points.length;i++)i?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]);
  ctx.stroke();ctx.setLineDash([]);
 }
 // v787: labels são desenhados SOMENTE NA COLUNA DIREITA, em duas passagens.
 // Primeiro coleta coordenadas e traça linhas; depois posiciona badges sem colisão.
 const labelQueue=[];
 function horizontal(price,label,col,dashed=false){
  if(!positivo(price))return;
  const y=py(price);
  trace([[L,y],[right,y]],col,2,dashed?[8,6]:[]);
  labelQueue.push({price,label:String(label),color:col,ideal:y});
 }
 function drawPriceLabels(){
  if(!labelQueue.length)return;
  const minY=T+14,maxY=chartBottom-14,gap=22;
  const ordered=labelQueue.slice().sort((a,b)=>a.ideal-b.ideal||a.price-b.price);
  // Todas as etiquetas ficam em corredor lateral exclusivo de largura >=135px.
  // O algoritmo não esconde valores: reduz a fonte, mas preserva 22px entre centros.
  if(ordered.length*gap>maxY-minY+gap)throw Error('Escala sem altura para rótulos do Fibonaccing');
  ordered.forEach((p,i)=>{p.y=Math.max(minY,Math.min(maxY,p.ideal));
   if(i)p.y=Math.max(p.y,ordered[i-1].y+gap);
  });
  const overflow=ordered.at(-1).y-maxY;
  if(overflow>0){for(const p of ordered)p.y-=overflow;}
  for(let i=ordered.length-2;i>=0;i--)ordered[i].y=Math.min(ordered[i].y,ordered[i+1].y-gap);
  const underflow=minY-ordered[0].y;
  if(underflow>0)for(const p of ordered)p.y+=underflow;
  const labelX=right+10,width=R-20;
  for(const p of ordered){
   ctx.strokeStyle=p.color;ctx.lineWidth=1.3;ctx.beginPath();
   ctx.moveTo(right,p.ideal);ctx.lineTo(right+5,p.y);ctx.stroke();
   ctx.fillStyle=/^(Gatilho|Stop|Invalidação)/.test(p.label)?p.color:'#1E293B';
   ctx.fillRect(labelX,p.y-10,width,20);
   ctxText(p.label.slice(0,17),labelX+6,p.y+4,12,'#FFFFFF');
   ctxText(axisLabel(p.price),labelX+width-5,p.y+4,12,'#FFFFFF','right');
  }
 }

 if(kind==='trend'){
  const ma=[['SMA 20',20,'#2563EB'],['SMA 50',50,'#EA580C'],['SMA 150',150,'#9333EA'],['SMA 200',200,'#111827']];
  const scale=candles.length;
  for(let k=0;k<ma.length;k++){
   const [name,n,col]=ma[k],pts=[];
   for(let i=offset;i<scale;i++){if(i+1<n)continue;
    let sum=0;for(let j=i-n+1;j<=i;j++)sum+=candles[j].c;
    pts.push([candlesX(i-offset),py(sum/n)]);
   }
   trace(pts,col,3);
   ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();
   ctx.moveTo(L+(k%4)*265,T-24);ctx.lineTo(L+(k%4)*265+24,T-24);ctx.stroke();
   ctxText(name,L+(k%4)*265+33,T-18,16,col);
  }
  const obv=[0];
  for(let i=1;i<candles.length;i++)obv.push(obv.at(-1)+(candles[i].c>candles[i-1].c?candles[i].v:
    candles[i].c<candles[i-1].c?-candles[i].v:0));
  const obv90=obv.slice(-90),oMin=Math.min(...obv90),oMax=Math.max(...obv90);
  const oRange=Math.max(1,oMax-oMin),oy=v=>f(v,volTop+28,H-B,oMin-oRange*.1,oMax+oRange*.1);
  ctxText('OBV · linha acumulada de volume',L,volTop+18,18,muted);
  for(let z=0;z<=2;z++){let y=volTop+32+z*(H-B-volTop-36)/2;
   trace([[L,y],[right,y]],grid,1);
  }
  trace(obv90.map((v,i)=>[candlesX(i),oy(v)]),'#475569',3);
  const prior=obv.slice(-26,-1);
  if(prior.length){
   const broken=side==='buy'?Math.max(...prior):Math.min(...prior);
   trace([[L,oy(broken)],[right,oy(broken)]],x.metrics?.obvConfirmed?rise:fall,1.5,[7,5]);
   ctxText('Nível anterior OBV',right-6,volTop+16,15,muted,'right');
  }
 }
 if(kind==='fibo'){
  const d=x.fib?.defense;
  if(Array.isArray(d)&&d.length===2&&d.every(positivo)){
   const top=Math.min(py(d[0]),py(d[1])),bot=Math.max(py(d[0]),py(d[1]));
   ctx.fillStyle='rgba(8,153,129,.10)';ctx.fillRect(L,top,plotW,Math.max(1,bot-top));
   // Apenas o sombreamento marca a zona de defesa; todos os rótulos ficam na escala direita.
  }
  for(const z of fibLevels){
   const val=z.r||0,name=z.r>1?'Exp '+(z.r*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':
     (z.r*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
   horizontal(z.price,name,'#64748B',val>=1);
  }
  const lines=[['Gatilho',plan.entry,'#2563EB'],['Stop',plan.stop,fall],
   ['Invalidação',x.fib?.stopTolerance,fall]];
  for(const [label,v,col] of lines)if(positivo(v))horizontal(v,label,col,true);
 }
 if(kind==='elliott'){
  const z=swingsPDF(candles),confirmed=z.filter(p=>p.i>=offset).slice(-6);
  trace(confirmed.map(p=>[candlesX(p.i-offset),py(p.p)]),'#1D4ED8',3);
  const labelMap=x.elliott?.valid&&confirmed.length>=6?['0','1','2','3','4','5']:
   x.elliott?.correction&&confirmed.length>=4?['','A','B','C']:null;
  confirmed.forEach((p,i)=>{
   const label=labelMap?.length===confirmed.length?labelMap[i]:'P'+(i+1);
   ctx.fillStyle='#1D4ED8';ctx.beginPath();ctx.arc(candlesX(p.i-offset),py(p.p),5,0,Math.PI*2);ctx.fill();
   ctxText(label,candlesX(p.i-offset)+7,py(p.p)-11,17,'#1D4ED8');
  });
  const initial=confirmed.length>=4?confirmed[0]:null;
  if(initial&&positivo(initial.p))horizontal(initial.p,'Invalidação estrutural possível',fall,true);
  else ctxText('Invalidação não confirmada: pivôs insuficientes',L,T+21,17,fall);
 }
 drawPriceLabels();
 for(const i of [0,30,60,89]){
  const c=view[i],day=new Date(c.t);
  const label=Number.isFinite(day.getTime())?day.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):'N/D';
  ctxText(label,candlesX(i),H-24,16,muted,'center');
 }
 return {png:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,
   pivots:kind==='elliott'?swingsPDF(candles).filter(p=>p.i>=offset).slice(-6):[]};
}
function descricaoGrafico(kind,r,x,candles,graph){
 const side=r.pdfSide==='sell'?'venda':'compra',dir=r.pdfSide==='sell'?-1:1;
 const p=x.plan||{},met=x.metrics||{};
 if(kind==='trend'){
  const slope=dir*(met.sma20-met.sma50)>0&&dir*(met.sma50-met.sma150)>0&&dir*(met.sma150-met.sma200)>0;
  return 'Médias '+(slope?'alinhadas na direção de '+side:'sem alinhamento integral confirmado')+
   '. Pullback sem fechamento além da SMA 20: '+(x.pisani?.pullback?'critério atendido':'não confirmado')+
   '. OBV: '+(met.obvSignal||'não confirmado')+
   '. Trend Template Minervini: '+(x.minervini?.score==null?'indisponível':x.minervini.score+'/8')+
   ' (heurístico). São 90 candles exibidos, com médias calculadas sobre o histórico completo.';
 }
 if(kind==='fibo'){
  const safe=v=>positivo(v)?n(v,2):'Não calculável';
  const rr=Number.isFinite(p.rr)?n(p.rr,2):'Não calculável';
  return 'Fibonaccing derivado de pivôs confirmados (heurística, não marcação autoral certificada). '+
   'Gatilho '+safe(p.entry)+' via '+(x.turn?.confirmed?'modelo 4-Barras confirmado':'pivô condicional')+
   '; CISD '+(x.turn?.cisd?'confirmado':'pendente')+
   '. Stop técnico '+safe(p.stop)+'; alvos 111/127,2/141,4/161,8%: '+
   [p.target1,p.target2a,p.target2,p.targetFinal].map(safe).join(' / ')+
   '. Relação risco/retorno para 127,2% = '+rr+'. Nenhuma projeção menor ou igual a zero é plotada.';
 }
 const points=graph.pivots||[],initial=points.length>=4?points[0]:null;
 const reference=initial&&positivo(initial.p)?n(initial.p,2):'não confirmada';
 const last=points.at(-1);
 return 'Contagem ZigZag baseada exclusivamente em pivôs observados com duas barras de confirmação. '+
  'Hipótese Elliott: '+String(x.elliott?.label||'Indeterminada')+'. '+
  String(x.elliott?.reason||'Sem estrutura suficiente')+'. '+
  (x.elliott?.valid&&last?'Confirmação condicional exige rompimento do pivô '+n(last.p,2)+'. ':
   'Não existe confirmação de onda em curso. ')+
  'Invalidação estrutural candidata: '+reference+
  '. A contagem é experimental; rótulos P indicam pivôs, não ondas certificadas.';
}

// Reservar a janela durante o clique evita bloqueio do Safari após tarefas assíncronas.
function prepare(){
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(!ios)return null;
 try{const win=w.open('','_blank');if(win){win.document.title='Preparando PDF';win.document.body.textContent='Preparando PDF…'}return win}catch{return null}
}
async function deliver(pdf,title,ticket=null){
 if(typeof File==='function'&&navigator.canShare&&navigator.share){
  try{const file=new File([pdf.blob],pdf.name,{type:'application/pdf'});
   if(navigator.canShare({files:[file]})){
    try{await navigator.share({title,files:[file]});ticket?.close?.();return {shared:true,pages:pdf.pages}}
    catch(e){if(e?.name==='AbortError'){ticket?.close?.();return {cancelled:true}}}
   }
  }catch{/* Safari pode negar compartilhar sem ativação temporária. */}
 }
 const url=URL.createObjectURL(pdf.blob);let preview=false;
 if(ticket&&!ticket.closed)try{ticket.location.replace(url);preview=true}catch{}
 if(!preview){const a=document.createElement('a');a.href=url;a.download=pdf.name;document.body.appendChild(a);a.click();a.remove()}
 setTimeout(()=>URL.revokeObjectURL(url),300000);
 return {preview,downloaded:!preview,pages:pdf.pages};
}
async function buildLivermore(ticker,analysis,rawCandles,opts={}){
 if(!w.DiarioLivermoreGraficos?.renderAll)throw Error('Renderizador dos 4 Gráficos do Livermore indisponível');
 const tf=String(opts.tf||'1d'),tk=String(ticker||'ATIVO').toUpperCase();
 const bundle=w.DiarioLivermoreGraficos.renderAll({ticker:tk,analysis,candles:rawCandles,tf,theme:'light',dir:opts.dir});
 const P=await libs(),doc=await P.PDFDocument.create();doc.registerFontkit(w.fontkit);
 const fonts=await Promise.all(['pdf-sans.ttf','pdf-sans-bold.ttf','pdf-serif-bold.ttf'].map(async f=>{const r=await fetch(f,{cache:'force-cache'});if(!r.ok)throw Error('Fonte do PDF indisponível: '+f);return doc.embedFont(new Uint8Array(await r.arrayBuffer()),{subset:true})}));
 const [reg,bold,serif]=fonts,W=595.28,H=841.89,M=43,col=Object.fromEntries(Object.entries(C).map(([k,v])=>[k,color(P,v)]));
 let page,y,pageCount=0;
 const LOGOS=await (w.DiarioPDFLogos?.carregar(doc,[tk])||new Map());
 const logo=(x,top,sz)=>w.DiarioPDFLogos?.desenhar(page,LOGOS,tk,x,top,sz,H)||0;
 function rect(x,top,wd,h,fill){page.drawRectangle({x,y:H-top-h,width:wd,height:h,color:fill})}
 function write(text,x,top,size=9,font=reg,fill=col.ink,right=false){
  const value=String(text??'').replace(/[\r\n\t]+/g,' ').trim();if(!value)return;
  let v=value;while(v.length>1&&font.widthOfTextAtSize(v,size)>W-M-x+((right?x:0)))v=v.slice(0,-2)+'…';
  const measured=font.widthOfTextAtSize(v,size);
  page.drawText(v,{x:right?x-measured:x,y:H-top-size,font,size,color:fill});
 }
 function wrap(text,x,top,width,size=9,leading=13.5,font=reg,fill=col.ink,limit=18){
  const words=String(text??'').replace(/\s+/g,' ').trim().split(' ');let line='',printed=0;
  for(const word of words){const next=line?line+' '+word:word;
   if(font.widthOfTextAtSize(next,size)>width&&line){write(line,x,top,size,font,fill);top+=leading;printed++;line=word;if(printed>=limit)return top}
   else line=next;
  }if(line&&printed<limit){write(line,x,top,size,font,fill);top+=leading}
  return top;
 }
 function footer(){
  rect(M,791,W-2*M,.7,col.line);
  write('Diário de Trader · Livermore · '+tk,M,802,7.5,reg,col.muted);
  write(String(pageCount).padStart(2,'0'),W-M,802,8,reg,col.muted,true);
 }
 function newPage(title,subtitle,cover=false){
  page=doc.addPage([W,H]);pageCount++;rect(0,0,W,cover?205:66,col.dark);
  write('DIÁRIO DE TRADER',M,18,9,bold,col.gold);write('LIVERMORE · TÉCNICO',W-M,18,8,reg,col.paper,true);
  rect(M,cover?194:63,56,2,col.gold);
  if(cover){logo(W-M-44,82,42);write(tk,M,76,30,serif,col.paper);write(title,M,122,14,bold,col.gold);write(subtitle,M,148,9.5,reg,col.paper);y=236}
  else{write(title,M,84,16,serif,col.ink);y=110;y=wrap(subtitle,M,y,W-2*M,9,13,reg,col.muted,2)+16}
 }
 const x=bundle.analysis||{},met=x.metrics||{},dow=x.structure?.dow||{},frac=x.structure?.fractality||{};
 newPage('Relatório Técnico Completo · 4 Gráficos Oficiais','Período '+tf.toUpperCase()+' · Gerado em '+new Date().toLocaleDateString('pt-BR'),true);
 write('RESUMO ESTRUTURAL',M,y,10,bold,col.gold);y+=22;
 y=wrap(bundle.synthesis.fechamento,M,y,W-2*M,10,15,reg,col.ink,10)+18;
 write('PAINEL DE REFERÊNCIAS',M,y,10,bold,col.gold);y+=22;
 const rowsInfo=[
  ['Último fechamento',n(x.price,2)],
  ['Tendência Dow (Primária / Secundária)',(dow.primaryTrend||'indefinida')+' / '+(dow.secondaryTrend||'indefinida')],
  ['Fractalidade (Mensal / Semanal / Diário)',frac.summary||'em avaliação'],
  ['MM20 / MM50 / MM200 (diário)',[met.sma20,met.sma50,met.sma200].map(v=>n(v,2)).join(' · ')],
  ['MM10 / MM40 (semanal)',[met.sma10w,met.sma40w].map(v=>n(v,2)).join(' · ')],
  ['IFR 14 / ATR 14 / OBV',n(met.rsi14,1)+' · '+n(met.atr14,2)+' · '+(met.obvSignal||'em observação')]
 ];
 for(const [k,v] of rowsInfo){
  rect(M,y-4,W-2*M,24,color(P,'#F8F9FA'));
  write(k,M+8,y+2,8.5,reg,col.muted);write(v,W-M-8,y+2,8.5,bold,col.ink,true);y+=27;
 }
 footer();
 // 1 página dedicada para cada um dos 4 Gráficos Oficiais do Livermore
 for(const chart of bundle.charts){
  newPage(chart.title,chart.subtitle);
  if(chart.png){
   const png=await doc.embedPng(chart.png);
   const wChart=W-2*M,hChart=wChart*chart.height/chart.width;
   page.drawImage(png,{x:M,y:H-y-hChart,width:wChart,height:hChart});
   y+=hChart+22;
  }
  write('LEITURA TÉCNICA',M,y,10,bold,col.gold);y+=18;
  y=wrap(chart.reading,M,y,W-2*M,9.5,14.5,reg,col.ink,14);
  footer();
 }
 // Página final: Síntese Operacional
 newPage('Síntese Operacional · '+tk,'Mapa de confluências, cenários condicionais e fechamento consolidado');
 write('MAPA DE CONFLUÊNCIAS',M,y,10,bold,col.gold);y+=18;
 if(bundle.synthesis.confluencias.length){
  for(const c of bundle.synthesis.confluencias){
   write(n(c.faixa[0],2)+' – '+n(c.faixa[1],2)+' ('+(c.distanciaPct>=0?'+':'')+n(c.distanciaPct,1)+'%)',M,y,9,bold,col.ink);
   y=wrap(c.fatores.join(' + '),M+155,y,W-2*M-155,8.5,12.5,reg,col.muted,2)+8;
  }
 }else{
  y=wrap('Nenhuma sobreposição densa de níveis identificada próximo ao fechamento atual.',M,y,W-2*M,9,13,reg,col.muted,2)+10;
 }
 y+=12;write('CENÁRIOS CONDICIONAIS',M,y,10,bold,col.gold);y+=20;
 for(const key of ['comprador','neutro','vendedor']){
  const sc=bundle.synthesis.cenarios[key];
  const barCol=key==='comprador'?col.green:key==='vendedor'?col.red:col.gold;
  rect(M,y-2,3,54,barCol);
  write(sc.titulo,M+12,y,9.5,bold,barCol);y+=15;
  y=wrap('Gatilho: '+sc.gatilho+' · Referência: '+sc.alvo+' · Invalidação: '+sc.invalidacao,M+12,y,W-2*M-12,8.5,12.5,reg,col.ink,4)+12;
 }
 y+=8;write('FECHAMENTO CONSOLIDADO',M,y,10,bold,col.gold);y+=18;
 y=wrap(bundle.synthesis.fechamento,M,y,W-2*M,9.5,14.5,reg,col.ink,10);
 footer();
 doc.setTitle('Livermore Técnico '+tk+' · Diário de Trader');doc.setAuthor('Diário de Trader');
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Livermore-Tecnico-'+tk+'-'+new Date().toISOString().slice(0,10)+'.pdf',pages:doc.getPageCount()};
}
async function share(m,rows,tf,ticket=null){
 try{return await deliver(await build(m,rows,tf),'Dossiê Técnico — Diário de Trader',ticket)}
 catch(e){ticket?.close?.();throw e}
}
async function shareLivermore(ticker,analysis,rawCandles,opts={},ticket=null){
 try{return await deliver(await buildLivermore(ticker,analysis,rawCandles,opts),'Livermore Técnico '+ticker+' — Diário de Trader',ticket)}
 catch(e){ticket?.close?.();throw e}
}
w.DiarioPDFiOS={prepare,deliver};
w.DiarioTecnicoPDF={build,share,buildLivermore,shareLivermore};
})(window);
