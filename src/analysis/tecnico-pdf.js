/* Dossiê Técnico editorial v762: exportação 100% local, sem IA automática nem banco. */
(function(w){
'use strict';
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
 if(!['br','world'].includes(m)||!Array.isArray(rows)||rows.length<1||rows.length>10)throw Error('Dossiê requer de 1 a 10 ativos calculados');
 const P=await libs(),doc=await P.PDFDocument.create();doc.registerFontkit(w.fontkit);
 const fonts=await Promise.all(['pdf-sans.ttf','pdf-sans-bold.ttf','pdf-serif-bold.ttf'].map(async f=>{const r=await fetch(f,{cache:'force-cache'});if(!r.ok)throw Error('Fonte do PDF indisponível: '+f);return doc.embedFont(new Uint8Array(await r.arrayBuffer()),{subset:true})}));
 const [reg,bold,serif]=fonts,W=595.28,H=841.89,M=43,col=Object.fromEntries(Object.entries(C).map(([k,v])=>[k,color(P,v)]));
 let page,y,pageCount=0;
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
  write('Estudo educacional · Dados de mercado sujeitos a atraso · Sem recomendação',M,802,7,reg,col.muted);
  write(String(pageCount).padStart(2,'0'),W-M,802,8,reg,col.muted,true);
 }
 function comp(r){
  const x=r.buy?.eligible&&(!r.sell?.eligible||r.buy.score>=r.sell.score)?r.buy:r.sell?.eligible?r.sell:(r.buy?.score??-1)>=(r.sell?.score??-1)?r.buy:r.sell;
  return {x,side:x===r.buy?'COMPRA':'VENDA/SHORT'};
 }
 function verified(x){
  if(!x?.valid||x.score==null||x.pillars?.length!==4)return false;
  const weights=x.pillars.map(p=>p.weight).reduce((a,b)=>a+b,0);
  const calc=x.pillars.reduce((a,p)=>a+p.score*p.weight/10,0);
  return weights===100&&Math.abs(calc-x.score)<=.11&&x.barCount>=210;
 }
 const region=m==='br'?'BRASIL / B3':'EUA & CRIPTO / NYSE · NASDAQ · BINANCE';
 newPage(region,region+' · '+rows.length+' ativos · '+tf,true);
 write('RANKING TÉCNICO  |  0 A 10',M,y,10,bold,col.gold);y+=31;
 y=wrap('Os ativos são ordenados pelos quatro pilares calculados sobre candles reais. Um número elevado não substitui a confirmação do preço, volume e risco. O Top automático exclui sinais esticados e sem confirmação de OBV.',M,y,W-2*M,10,15)+24;
 rect(M,y,W-2*M,27,col.dark);
 write('POS.',M+10,y+7,8,bold,col.paper);write('ATIVO',M+62,y+7,8,bold,col.paper);write('LADO',M+178,y+7,8,bold,col.paper);write('NOTA',M+327,y+7,8,bold,col.paper);write('CONFERÊNCIA',M+395,y+7,8,bold,col.paper);y+=27;
 for(let i=0;i<rows.length;i++){
  const r=rows[i],s=comp(r),x=s.x;
  rect(M,y,W-2*M,33,i%2?col.paper:color(P,'#F3F4F5'));
  write(String(i+1).padStart(2,'0'),M+10,y+10,9,bold);
  write(r.ticker,M+62,y+10,9,bold);write(s.side,M+178,y+10,8);
  write(n(x.score,1)+'/10',M+327,y+10,9,bold);
  write(verified(x)?'CÁLCULO CONFERE':'REVISAR BASE',M+395,y+10,7.4,bold,verified(x)?col.green:col.red);
  y+=33;
 }
 y+=29;y=wrap('Snapshot local: '+new Date().toLocaleString('pt-BR')+' · Período: '+tf+'. Fontes de preços informadas individualmente. RS Rating usa percentis da amostra se houver benchmark e pares suficientes; não é a classificação proprietária de terceiros.',M,y,W-2*M,8,12,reg,col.muted,6);footer();
 for(let i=0;i<rows.length;i++){
  const r=rows[i],{x,side}=comp(r);newPage(String(i+1).padStart(2,'0')+' / '+String(rows.length).padStart(2,'0')+'   '+r.ticker+'   '+side,'OHLCV '+tf+' · '+(r.source||'fonte não informada')+' · '+(r.updatedAt||'data indisponível'));
  write('NOTA TÉCNICA',M,y,10,bold,col.gold);
  write(n(x.score,1)+' / 10',M,y+18,23,serif);
  write(verified(x)?'CÁLCULO CONFERE':'EXIGE CONFERÊNCIA',W-M,y+28,9,bold,verified(x)?col.green:col.red,true);y+=76;
  rect(M,y,W-2*M,60,color(P,'#F2F3F4'));
  y=wrap('Tendência '+(x.metrics?.mtf===true?'MTF alinhada':x.metrics?.mtf===null?'MTF não verificável':'MTF divergente')+'. OBV '+(x.metrics?.obvConfirmed?'rompeu nível anterior':'não confirmado')+'. Volume relativo '+n(x.metrics?.rvol,2)+'x. HV semanal '+n(x.metrics?.hvWeek)+'%.',M+11,y+10,W-2*M-22,9,13,reg,col.ink,3)+22;
  write('COMPOSIÇÃO DA NOTA',M,y,10,bold,col.gold);y+=28;
  for(const p of x.pillars)bar(p.name,p.score,p.weight);
  y+=10;write('PLANO CONDICIONAL · REFERÊNCIAS FIBONACCING',M,y,10,bold,col.gold);y+=24;
  const pl=x.plan||{};
  for(const [a,b] of [['Gatilho',pl.entry],['Stop técnico',pl.stop],['Alvo 1 · 111%',pl.target1],['Alvo 2 · 141,4%',pl.target2],['Alvo final · 161,8%',pl.targetFinal],['Risco/Retorno',pl.rr]]){
   write(a,M,y,9,reg,col.muted);write(n(b,2),W-M,y,9,bold,col.ink,true);y+=21;
  }
  y+=9;write('SINAIS E INVALIDAÇÕES',M,y,10,bold,col.gold);y+=21;
  const flags=(x.flags||[]).join('; ')||'Nenhuma trava antiarmadilha disparada';
  y=wrap('Alertas: '+flags+'. Fibo Cluster: '+(x.fib?.cluster?'sim':'não')+'. RMC 4-Barras: '+(x.turn?.confirmed?'confirmada':'não confirmada')+'. CISD: '+(x.turn?.cisd?'confirmado':'pendente')+'.',M,y,W-2*M,9,13,reg,col.ink,3)+9;
  y=wrap('Elliott: '+(x.elliott?.label||'indeterminado')+'. '+(x.elliott?.reason||'Contagem não conclusiva')+'.',M,y,W-2*M,8,12,reg,col.muted,2);
  footer();
 }
 newPage('Metodologia e conferência','Regras, fórmulas, evidências e limites do modelo local');
 write('PESOS DA NOTA',M,y,10,bold,col.gold);y+=26;
 for(const [p,z] of [['Tendência & Estrutura',30],['Momentum / OBV / Força Relativa',30],['Volume & Fluxo',20],['Fibonaccing / Volatilidade / Risco',20]]){
  write(p,M,y,9);write(z+'%',W-M,y,9,bold,col.ink,true);y+=26;
 }
 y+=22;
 for(const [head,paragraph] of [
  ['DADOS / HISTÓRICO','Cálculos exclusivamente sobre candles OHLCV normalizados, descartando dados inconsistentes. Mínimo 210 candles e 100 candles com volume positivo. Timeframes intradiários são conferidos contra um período superior quando disponível. Histórico pode apresentar atraso ou ajustes.'],
  ['FIBONACCING · IMPLEMENTAÇÃO HEURÍSTICA','Retrações 0/23,6/38,2/50/61,8/76,4/100%; extensões 111/127,2/141,4/161,8%. Pivôs são confirmados com duas barras futuras observadas. Clusters exigem convergência de até 1%. RMC/CISD usam condições explícitas de barras e estrutura. A implementação não afirma reproduzir integralmente regras autorais dos instrutores.'],
  ['PISANI · MINERVINI · ELLIOTT','SMA 20/50/150/200, OBV, volume relativo, volatilidade semanal, VCP e checagem direcional. Trend Template 8/8 requer histórico diário e RS válido. Elliott é hipótese de contagem sob regras mínimas de invalidação, nunca detecção inequívoca de ondas.'],
  ['CÁLCULO CONFERE / ANTIARMADILHA','Selo atesta somente soma ponderada dos quatro pilares, 100% de pesos e histórico mínimo. Não certifica proveniência, atrasos, uma tese ou lucratividade. Top 10 bloqueia exaustão (extensões 141,4%–161,8%, afastamento 2,5 ATR), falta de volume ou OBV não confirmado.'],
  ['IA E RESPONSABILIDADE','Este dossiê determinístico não faz requisições à IA nem ao Supabase. A pesquisa por IA é uma ação separada e depende de confirmação externa dos números. Liquidez, slippage, spreads, ajustes corporativos e regras locais de short selling devem ser conferidos antes de operar.']
 ]){
  write(head,M,y,8.5,bold,col.gold);y+=16;y=wrap(paragraph,M,y,W-2*M,8.5,12,reg,col.ink,7)+12;
 }
 footer();
 doc.setTitle('Dossiê Técnico '+region+' · Diário de Trader');doc.setAuthor('Diário de Trader');
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Dossie-Tecnico-'+(m==='br'?'Brasil':'EUA-Cripto')+'-'+new Date().toISOString().slice(0,10)+'.pdf',pages:doc.getPageCount()};
}
async function share(m,rows,tf){
 const pdf=await build(m,rows,tf);
 if(typeof File==='function'&&navigator.canShare&&navigator.share){
  const file=new File([pdf.blob],pdf.name,{type:'application/pdf'});
  if(navigator.canShare({files:[file]}))try{await navigator.share({title:'Dossiê técnico',files:[file]});return {shared:true,pages:pdf.pages}}catch(e){if(e?.name==='AbortError')return {cancelled:true}}
 }
 const url=URL.createObjectURL(pdf.blob),link=document.createElement('a');link.href=url;link.download=pdf.name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);return {downloaded:true,pages:pdf.pages};
}
w.DiarioTecnicoPDF={build,share};
})(window);
