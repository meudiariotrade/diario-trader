/* Pesquisa: exportação PDF local, sem alterar os relatórios editoriais existentes. */
(function(w){'use strict'
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
// Gráfico editorial de Pesquisa: usa exclusivamente os 90 candles já coletados pelo backend.
// Preços teóricos são referências horizontais condicionais, NUNCA candles futuros ou previsões certas.
function candlesConferidos(asset){
 const raw=asset?.candles;
 if(!asset?.ajustado||!/^https:\/\/query1\.finance\.yahoo\.com\/v8\/finance\/chart\//.test(String(asset?.fonte||''))||
  !Array.isArray(raw)||raw.length<289||!asset.as_of||!Number.isFinite(Date.parse(asset.as_of)))return null;
 const c=raw.map(z=>Array.isArray(z)&&z.length===6?z.map(Number):null);
 if(c.some((z,i)=>!z||z.some(x=>!Number.isFinite(x))||z[0]<=0||z[1]<=0||z[3]<=0||
   z[4]<=0||z[2]<Math.max(z[1],z[3],z[4])||z[3]>Math.min(z[1],z[4])||z[5]<0||
   (i>0&&z[0]<=c[i-1][0])))return null;
 if(new Date(c.at(-1)[0]*1000).toISOString()!==asset.as_of)return null;
 return c;
}
function pivotsConfirmados(rows){
 const piv=[];
 for(let i=2;i<rows.length-2;i++){
  const H=[i-2,i-1,i+1,i+2].every(j=>rows[i][2]>rows[j][2]);
  const L=[i-2,i-1,i+1,i+2].every(j=>rows[i][3]<rows[j][3]);
  for(const [ok,dir,value] of [[H,1,rows[i][2]],[L,-1,rows[i][3]]]){
   if(!ok)continue;
   const last=piv.at(-1);
   if(last?.dir===dir){
    if(dir===1?value>last.price:value<last.price)piv[piv.length-1]={i,dir,price:value};
   }else piv.push({i,dir,price:value});
  }
 }
 return piv;
}
function graficoPDF(asset,kind){
 const all=candlesConferidos(asset);if(!all)return null;
 const c=all.slice(-90),indicator=asset.estudo||{},tech=indicator.tech||{};
 const W=1320,H=720,L=78,R=150,T=78,B=65,bottom=kind==='trend'?470:H-B,below=500;
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const fg='#111827',muted='#64748B',grid='#E5E7EB',up='#089981',down='#F23645';
 const text=(z,x,y,size=17,color=fg,align='left')=>{
  ctx.fillStyle=color;ctx.textAlign=align;ctx.font=size+'px Arial';ctx.fillText(String(z),x,y);
 };
 const pos=z=>typeof z==='number'&&Number.isFinite(z)&&z>0;
 const fPrice=z=>Number(z).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:z<1?4:2});
 const title={trend:'TENDÊNCIA · MM20/50/200 E OBV',fibo:'FIBONACCING · PLANO CONDICIONAL',
  elliott:'ELLIOTT · ZIGZAG E PIVÔS OBSERVADOS'}[kind];
 if(!title)return null;
 const side=tech.perna?.direcao==='baixa'?'baixa':'alta';
 const anchors=tech.perna||{},high=Math.max(Number(anchors.de),Number(anchors.ate)),
  low=Math.min(Number(anchors.de),Number(anchors.ate));
 const fibValid=pos(high)&&pos(low)&&high>low&&['alta','baixa'].includes(anchors.direcao);
 const amplitude=fibValid?high-low:null;
 const retrace=f=>!fibValid?null:side==='alta'?high-amplitude*f:low+amplitude*f;
 const expand=f=>!fibValid?null:side==='alta'?low+amplitude*f:high-amplitude*f;
 const fibRetr=[0,.236,.382,.5,.618,.764,1].map(f=>({label:(f*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',v:retrace(f)})).filter(p=>pos(p.v));
 const extensions=[1.11,1.272,1.414,1.618].map(f=>({label:(f*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',v:expand(f)})).filter(p=>pos(p.v));
 const trigger=tech.elliott?.gatilho,stop=tech.invalidacao?.v;
 const piv=pivotsConfirmados(c),confirmed=piv.slice(-6);
 const extra=kind==='fibo'?[...fibRetr,...extensions,{v:trigger},{v:stop}].map(z=>z.v).filter(pos):
  kind==='elliott'?[tech.invalidacao?.v].filter(pos):[];
 const values=c.flatMap(v=>[v[2],v[3]]).concat(extra);
 const pmin=Math.min(...values),pmax=Math.max(...values),pad=Math.max((pmax-pmin)*.06,pmax*.005,.00001);
 const lo=Math.max(.000001,pmin-pad),hi=pmax+pad;
 const y=v=>bottom-(v-lo)/(hi-lo)*(bottom-T),x=i=>L+(i+.5)*(W-R-L)/90;
 const line=(points,color,width=2,dash=[])=>{
  if(points.length<2)return;
  ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);
  for(let i=0;i<points.length;i++)i?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]);
  ctx.stroke();ctx.setLineDash([]);
 };
 const labelLine=(value,label,color,dashed=true)=>{
  if(!pos(value))return;
  const py=y(value);line([[L,py],[W-R,py]],color,2,dashed?[7,6]:[]);
  text(label+' '+fPrice(value),W-R-8,Math.max(T+18,Math.min(bottom-8,py-6)),16,color,'right');
 };
 ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
 text(String(asset.ticker).slice(0,12)+' · 1D · '+title,L,34,23);
 text('Último candle '+String(asset.as_of).slice(0,10),W-R,34,16,muted,'right');
 for(let i=0;i<=5;i++){
  const v=lo+(hi-lo)*i/5,yy=y(v);
  line([[L,yy],[W-R,yy]],grid,1,[]);
  text(fPrice(v),W-R+12,yy+5,16,muted);
 }
 line([[W-R,T],[W-R,bottom]],'#94A3B8',1);
 for(let i=0;i<c.length;i++){
  const z=c[i],color=z[4]>=z[1]?up:down,bw=Math.max(3,(W-R-L)/90*.54);
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.8;
  ctx.beginPath();ctx.moveTo(x(i),y(z[2]));ctx.lineTo(x(i),y(z[3]));ctx.stroke();
  ctx.fillRect(x(i)-bw/2,Math.min(y(z[1]),y(z[4])),bw,Math.max(2,Math.abs(y(z[1])-y(z[4]))));
 }
 if(kind==='trend'){
  for(const [n,col] of [[20,'#2563EB'],[50,'#EA580C'],[200,'#9333EA']]){
   const points=[];
   for(let i=all.length-90;i<all.length;i++){
    let sum=0;for(let j=i-n+1;j<=i;j++)sum+=all[j][4];
    points.push([x(i-(all.length-90)),y(sum/n)]);
   }
   line(points,col,3);text('MM'+n,L+(n===20?0:n===50?205:410),T-24,18,col);
  }
  const obv=[0];
  for(let i=1;i<all.length;i++)obv.push(obv.at(-1)+Math.sign(all[i][4]-all[i-1][4])*all[i][5]);
  const series=obv.slice(-90),min=Math.min(...series),max=Math.max(...series),scale=Math.max(1,max-min);
  const oy=v=>H-B-(v-min+scale*.1)/(scale*1.2)*(H-B-below);
  line([[L,below],[W-R,below]],grid,1);
  text('OBV · rompimento somente com último valor acima/abaixo do intervalo anterior',L,below+22,16,muted);
  const prior=series.slice(-21,-1),hiPrior=Math.max(...prior),loPrior=Math.min(...prior);
  line(series.map((v,i)=>[x(i),oy(v)]),'#475569',3);
  const level=side==='alta'?hiPrior:loPrior;
  const broken=side==='alta'?series.at(-1)>hiPrior:series.at(-1)<loPrior;
  line([[L,oy(level)],[W-R,oy(level)]],broken?up:down,2,[7,5]);
  text('OBV '+(broken?'ROMPIDO':'não confirmado'),W-R,below+22,16,broken?up:down,'right');
 }
 if(kind==='fibo'){
  if(fibValid){
   const z1=retrace(.5),z2=retrace(.618),yy=Math.min(y(z1),y(z2)),hh=Math.abs(y(z1)-y(z2));
   ctx.fillStyle='rgba(8,153,129,0.13)';ctx.fillRect(L,yy,W-R-L,hh);
   text('ZONA 50–61,8% · DEFESA CONDICIONAL',L+8,yy+20,16,up);
   for(const v of fibRetr)labelLine(v.v,v.label,'#64748B',false);
   for(const v of extensions)labelLine(v.v,'Exp '+v.label,'#089981',true);
   if(pos(trigger))labelLine(trigger,'Gatilho','#1D4ED8');
   if(pos(stop))labelLine(stop,'Stop / invalidação',down);
  }else text('Sem pivô confirmado: retrações e alvos não calculáveis',L,T+24,19,down);
 }
 if(kind==='elliott'){
  if(confirmed.length>=4){
   line(confirmed.map(v=>[x(v.i),y(v.price)]),'#1D4ED8',3);
   confirmed.forEach((v,i)=>{
    ctx.fillStyle='#1D4ED8';ctx.beginPath();ctx.arc(x(v.i),y(v.price),5,0,Math.PI*2);ctx.fill();
    text('P'+(i+1),x(v.i)+9,y(v.price)-9,18,'#1D4ED8');
   });
   if(pos(tech.invalidacao?.v))labelLine(tech.invalidacao.v,'Invalidação estrutural',down);
  }else text('Pivôs insuficientes para hipótese de ondas 1–5 / A–C',L,T+24,19,down);
 }
 for(const i of [0,30,60,89])
  text(new Date(c[i][0]*1000).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
   x(i),H-24,16,muted,'center');
 const safe=v=>pos(v)?fPrice(v):'não calculável';
 const explanation=kind==='trend'?
  'MM20/50/200 calculadas sobre '+all.length+' candles ajustados. OBV acumulado do volume real; rompimento é comparado com as 20 barras anteriores. O alinhamento das médias e a confirmação devem ser conferidos no relatório técnico.':
  kind==='fibo'?'Retrações ancoradas na perna documentada de '+safe(anchors.de)+' a '+safe(anchors.ate)+
   '. Gatilho '+safe(trigger)+'; stop '+safe(stop)+
   '; expansões 111/127,2/141,4/161,8% somente quando positivas. Padrão 4-Barras e CISD dependem de confirmação específica, não inferida pelo desenho.':
   'Pivôs ZigZag confirmados com duas barras à direita. A hipótese Elliott é experimental: '+
   String(tech.elliott?.fase||'sem identificação de onda')+
   '. Invalidação '+safe(tech.invalidacao?.v)+'. Rótulos P1…P6 são pivôs observados, não contagem certificada.';
 return {png:canvas.toDataURL('image/png'),explanation,title};
}
async function build(job){
 const r=job?.resultado;
 if(!r?.texto)throw Error('Não confirmado / Não calculável: pesquisa sem relatório.');
 const hash=await hashSnapshot({tipo:'pesquisa',formula:'pesquisa/relatorio v768',id:job.id||null,resultado:r});
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
 let chartCount=0;
 for(const chart of charts){
  if(!candlesConferidos(chart))continue;
  for(const kind of ['trend','fibo','elliott']){
   const visual=graficoPDF(chart,kind);if(!visual)continue;
   const picture=await doc.embedPng(visual.png);
   add();chartCount++;
   line(String(chart.ticker||'')+' · '+visual.title,true);
   const width=W-2*M,height=width*720/1320;
   page.drawImage(picture,{x:M,y:y-height-6,width,height});
   y-=height+26;
   line('LEITURA OBJETIVA DO ESTUDO',true);
   line(visual.explanation);
   line('Fonte OHLCV: '+String(chart.fonte||'não confirmada'));
   line('Ajuste corporativo: '+String(chart.ajuste||'não confirmado'));
   line('Última barra: '+String(chart.as_of||'não confirmada'));
  }
 }
 if(!chartCount){add();line('GRÁFICOS NÃO DISPONÍVEIS PARA ESTE ESTUDO',true);
  line('Esta pesquisa não contém 250+ candles ajustados, com fonte e período comprovados.');
  line('Não foram desenhados candles, médias, alvos ou ondas artificiais.');
  line('Para anexar gráficos, gere uma nova pesquisa com histórico diário confirmado.');
 }
 line('PROVENIÊNCIA E REPRODUTIBILIDADE',true);
 line('Versão do método: pesquisa/relatorio v768; SHA-256 do snapshot impresso no rodapé.');
 line('Documentos oficiais por indicador: somente quando identificados no relatório. Fonte genérica de catálogo não comprova demonstração financeira.');
 for(const item of charts)if(item?.fonte&&item?.ticker){
  line('OHLCV '+String(item.ticker)+': '+String(item.fonte));
  line('Ajuste: '+String(item.ajuste||'não confirmado')+' · última barra: '+String(item.as_of||'n/d'));
 }
  line('FONTES CONSULTADAS',true);
 for(const source of (r.fontes||[]).slice(0,24))line(String(source.titulo||'Fonte')+' — '+String(source.url||''));
 line('Consulta: '+String(r.consultado_em||'Não confirmado / Não calculável'));
 for(const pg of doc.getPages()){
  pg.drawText('Snapshot SHA-256: '+hash+' · Fórmula Pesquisa v768',{
   x:M,y:24,font:normal,size:6,color:P.rgb(.38,.42,.46)});
 }
  doc.setTitle('Pesquisa B3 e EUA — Diário de Trader');doc.setAuthor('Diário de Trader');
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Pesquisa-'+String(job.id||'analise').slice(0,8)+'.pdf',pages};
}
async function share(job,ticket=null){
 try{return await w.DiarioPDFiOS.deliver(await build(job),'Pesquisa B3 e EUA — Diário de Trader',ticket)}
 catch(e){ticket?.close?.();throw e}
}
w.DiarioPesquisaPDF={build,share};
})(window);
