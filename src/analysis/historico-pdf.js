/* v858 — PDF da Avaliação histórica (10 anos), desenhado em vetor com pdf-lib.
   iPhone/PWA não imprime com window.print(); aqui o arquivo é gerado no aparelho e entregue
   pelo compartilhar do iOS (DiarioPDFiOS). Nenhuma consulta ao Supabase. */
(function(w){
'use strict';
const fmt=(v,c=1)=>v==null||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});
const pct=(v,c=1)=>v==null||!Number.isFinite(v)?'—':fmt(v*100,c)+'%';
const bi=v=>v==null||!Number.isFinite(v)?'—':Math.abs(v)>=1e9?fmt(v/1e9,1)+' bi':fmt(v/1e6,0)+' mi';
const media=xs=>{const v=xs.filter(Number.isFinite);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};
async function libs(){
 const load=file=>w.DiarioChunks?.load?w.DiarioChunks.load(file):new Promise((ok,no)=>{const s=document.createElement('script');s.src=file;s.onload=ok;s.onerror=()=>no(Error('Biblioteca não disponível: '+file));document.head.appendChild(s)});
 if(!w.PDFLib)await load('pdf-lib.min.js');
 if(!w.fontkit)await load('fontkit.umd.min.js');
 if(!w.PDFLib||!w.fontkit)throw Error('Motor PDF indisponível.');
 return w.PDFLib;
}
async function gerar(tk,c,meta={},pos=null){
 if(!c?.serie?.length)throw Error('Abra a avaliação histórica antes de salvar o PDF.');
 const P=await libs(),doc=await P.PDFDocument.create();doc.registerFontkit(w.fontkit);
 const [sans,bold]=await Promise.all(['pdf-sans.ttf','pdf-sans-bold.ttf'].map(async n=>{const r=await fetch(n,{cache:'force-cache'});if(!r.ok)throw Error('Fonte PDF indisponível: '+n);return doc.embedFont(new Uint8Array(await r.arrayBuffer()),{subset:true})}));
 const us=!!meta.cik,MO=us?'US$ ':'R$ ';
 doc.setTitle('Avaliação histórica '+tk+' - Diário de Trader');doc.setAuthor('Diário de Trader');
 const W=595.28,H=841.89,M=36,CW=W-2*M,rgb=P.rgb;
 const C={tx:rgb(.07,.09,.12),mut:rgb(.39,.45,.53),rule:rgb(.85,.87,.9),ok:rgb(.06,.6,.42),neg:rgb(.85,.2,.2),at:rgb(.96,.62,.04),ln:rgb(.15,.39,.92),intr:rgb(.96,.62,.04),bg:rgb(.96,.97,.98)};
 let pg,y;
 const logos=await (w.DiarioPDFLogos?.carregar(doc,[tk])||new Map());
 const txt=(s,x,t,o={})=>{const f=o.bold?bold:sans,size=o.size||9;let str=String(s??'');
  if(o.max){while(str.length>1&&f.widthOfTextAtSize(str,size)>o.max)str=str.slice(0,-2)+'…'}
  const wd=f.widthOfTextAtSize(str,size),xx=o.align==='right'?x-wd:o.align==='center'?x-wd/2:x;
  pg.drawText(str,{x:xx,y:H-t-size,size,font:f,color:o.color||C.tx});return wd};
 const wrap=(s,x,t,max,o={})=>{const f=o.bold?bold:sans,size=o.size||8.5,lead=o.lead||size*1.35;let line='',yy=t;
  for(const w0 of String(s||'').split(/\s+/)){const tst=line?line+' '+w0:w0;if(f.widthOfTextAtSize(tst,size)>max&&line){txt(line,x,yy,o);yy+=lead;line=w0}else line=tst}
  if(line){txt(line,x,yy,o);yy+=lead}return yy};
 const rect=(x,t,wd,ht,color)=>pg.drawRectangle({x,y:H-t-ht,width:wd,height:ht,color});
 const lin=(x1,t1,x2,t2,color=C.rule,th=.6)=>pg.drawLine({start:{x:x1,y:H-t1},end:{x:x2,y:H-t2},thickness:th,color});
 const nova=()=>{pg=doc.addPage([W,H]);y=M;
  const lw=w.DiarioPDFLogos?.desenhar(pg,logos,tk,M,y,22,H)||0;
  txt(tk+' · '+(meta.nome||''),M+(lw?lw+6:0),y+3,{bold:true,size:14,max:CW-150});
  txt('Avaliação histórica · '+(meta.exercicios||[]).join('–'),W-M,y+6,{size:8,color:C.mut,align:'right'});
  y+=30;lin(M,y,W-M,y);y+=10};
 const rodape=()=>{txt('Fontes: '+(us?'SEC EDGAR XBRL (10-K/20-F)':'CVM (DFP)')+' e Yahoo Finance (preço mensal e dividendos). Cálculo no aparelho. Material educativo, não é recomendação.',M,H-26,{size:6.6,color:C.mut,max:CW});
  txt('Gerado em '+new Date().toLocaleString('pt-BR')+' · Diário de Trader',W-M,H-16,{size:6.6,color:C.mut,align:'right'})};
 const sec=t=>{if(y>H-120){rodape();nova()}txt(t,M,y,{bold:true,size:10.5});y+=18};
 // Velocímetro vetorial (mesmas zonas da tela)
 const ZONAS={roe:[0,.25,[.08,.15],1],margem:[0,.25,[.05,.12],1],dy:[0,.12,[.04,.07],1],dlpl:[-.5,2,[.5,1],-1],cagr:[-.2,.35,[0,.1],1],tr:[-.2,.35,[.05,.12],1]};
 const gauge=(ch,v,ref,cx,top,R)=>{const [mn,mx,[a,b],dir]=ZONAS[ch],cy=top+R,ang=q=>Math.PI*(1-Math.min(1,Math.max(0,(q-mn)/(mx-mn))));
  const zs=dir>0?[[mn,a,C.neg],[a,b,C.at],[b,mx,C.ok]]:[[mn,a,C.ok],[a,b,C.at],[b,mx,C.neg]];
  for(const [z1,z2,col] of zs){const n=14;for(let i=0;i<n;i++){const t1=ang(z1+(z2-z1)*i/n),t2=ang(z1+(z2-z1)*(i+1)/n);
   lin(cx+R*Math.cos(t1),cy-R*Math.sin(t1),cx+R*Math.cos(t2),cy-R*Math.sin(t2),col,5)}}
  if(Number.isFinite(ref)){const t=ang(ref);lin(cx+(R-6)*Math.cos(t),cy-(R-6)*Math.sin(t),cx+(R+6)*Math.cos(t),cy-(R+6)*Math.sin(t),C.tx,1.2)}
  if(Number.isFinite(v)){const t=ang(v);lin(cx,cy,cx+(R-9)*Math.cos(t),cy-(R-9)*Math.sin(t),C.tx,1.6)}
  pg.drawCircle({x:cx,y:H-cy,size:2.6,color:C.tx})};
 const card=(x,t,wd,ht)=>rect(x,t,wd,ht,C.bg);
 const indicador=(x,t,wd,ch,titulo,atual,ref,f)=>{card(x,t,wd,118);txt(titulo,x+8,t+7,{bold:true,size:8.4,max:wd-16});
  gauge(ch,atual,ref,x+wd/2,t+24,32);
  const melhor=Number.isFinite(atual)&&Number.isFinite(ref)?(ZONAS[ch][3]>0?atual>=ref:atual<=ref):null;
  txt(melhor==null?'Sem comparação':melhor?'Melhorando':'Piorando',x+wd/2,t+64,{size:7.6,align:'center',color:melhor==null?C.mut:melhor?C.ok:C.neg});
  txt('Histórico',x+8,t+82,{size:6.8,color:C.mut});txt(f(ref),x+8,t+92,{bold:true,size:9});
  txt('Atual',x+wd-8,t+82,{size:6.8,color:C.mut,align:'right'});txt(f(atual),x+wd-8,t+92,{bold:true,size:9,align:'right'})};
 const grafico=(x,t,wd,ht,titulo,pts,o={})=>{card(x,t,wd,ht);txt(titulo,x+8,t+7,{bold:true,size:8.4,max:wd-16});
  const p=pts.filter(q=>Number.isFinite(q.y));const l=x+40,r=x+wd-8,tp=t+24,bt=t+ht-18;
  if(p.length<2){txt('Dados insuficientes.',x+8,t+30,{size:8,color:C.mut});return}
  const ys=p.map(q=>q.y),mn=Math.min(0,...ys),mx=Math.max(...ys),sp=mx-mn||1,X=i=>l+(r-l)*(i/(p.length-1)),Y=v=>tp+(bt-tp)*(1-(v-mn)/sp);
  for(const v of [mn,mn+sp/2,mx]){lin(l,Y(v),r,Y(v));txt((o.f||(q=>fmt(q,1)))(v),l-3,Y(v)-3,{size:6,color:C.mut,align:'right'})}
  if(o.barras){const bw=Math.max(3,(r-l)/p.length*.55);p.forEach((q,i)=>{const y0=Y(0),y1=Y(q.y);rect(X(i)-bw/2,Math.min(y0,y1),bw,Math.max(.8,Math.abs(y1-y0)),q.y<0?C.neg:C.ln)})}
  else{for(let i=1;i<p.length;i++)lin(X(i-1),Y(p[i-1].y),X(i),Y(p[i].y),C.ln,1.4);p.forEach((q,i)=>pg.drawCircle({x:X(i),y:H-Y(q.y),size:1.6,color:C.ln}))}
  p.forEach((q,i)=>txt(String(q.x).slice(-2),X(i),bt+4,{size:6,color:C.mut,align:'center'}))};
 const cr=c.crescimento,a=c.atual,h=c.historico;
 nova();
 txt((meta.setor?meta.setor+' · ':'')+'preço '+MO+fmt(a.preco,2)+' · exercícios '+(meta.exercicios||[]).join('–'),M,y,{size:8.5,color:C.mut,max:CW});y+=18;
 sec('Qualidade histórica · últimos 10 anos');
 const cw=(CW-3*8)/4;
 indicador(M,y,cw,'roe','Rentabilidade (ROE)',a.roe,h.roe,v=>pct(v));
 indicador(M+(cw+8),y,cw,'margem','Margem líquida',a.margem,h.margem,v=>pct(v));
 indicador(M+2*(cw+8),y,cw,'dy','Dividend yield',a.dy,h.dy,v=>pct(v));
 indicador(M+3*(cw+8),y,cw,'dlpl','Dívida líquida / PL',a.dlpl,h.dlpl,v=>v==null||!Number.isFinite(v)?'—':fmt(v,2)+'x');
 y+=128;
 card(M,y,CW,52);txt('Preço × valor intrínseco (Graham)',M+8,y+7,{bold:true,size:8.4});
 txt('Valor intrínseco '+MO+fmt(a.intrinseco,2)+'   ·   Preço '+MO+fmt(a.preco,2),M+8,y+24,{size:9});
 txt(c.desconto==null?'—':(c.desconto<0?'Desconto ':'Ágio ')+pct(Math.abs(c.desconto)),W-M-8,y+18,{bold:true,size:14,align:'right',color:c.desconto<0?C.ok:C.neg});
 txt('√(22,5 × lucro × patrimônio) por ação de hoje, sobre o último balanço anual. Estimativa, não recomendação.',M+8,y+38,{size:6.8,color:C.mut,max:CW-16});
 y+=62;
 // Preço mensal × degraus do valor intrínseco
 {const m=c.meses.filter(q=>q.c>0),ht=170;card(M,y,CW,ht);txt('Criação de valor · preço mensal × valor intrínseco anual',M+8,y+7,{bold:true,size:8.4});
  if(m.length>=12){const ints=c.serie.filter(q=>q.intrinseco>0),l=M+44,r=W-M-8,tp=y+26,bt=y+ht-30,t0=m[0].t,t1=m[m.length-1].t;
   const mx=Math.max(...m.map(q=>q.c),...ints.map(q=>q.intrinseco))*1.08,X=t=>l+(r-l)*(t-t0)/(t1-t0||1),Y=v=>tp+(bt-tp)*(1-v/mx);
   for(const v of [0,mx/2,mx]){lin(l,Y(v),r,Y(v));txt(fmt(v,2),l-3,Y(v)-3,{size:6,color:C.mut,align:'right'})}
   ints.forEach((q,i)=>{const s0=Date.UTC(q.ano+1,2,31)/1000,s1=ints[i+1]?Date.UTC(ints[i+1].ano+1,2,31)/1000:t1;if(s1<t0)return;lin(X(Math.max(s0,t0)),Y(q.intrinseco),X(Math.min(s1,t1)),Y(q.intrinseco),C.intr,1.8)});
   for(let i=1;i<m.length;i++)lin(X(m[i-1].t),Y(m[i-1].c),X(m[i].t),Y(m[i].c),C.ln,1.1);
   const anos=[...new Set(m.map(q=>q.ano))];anos.filter((q,i)=>i%Math.ceil(anos.length/8)===0).forEach(q=>{const tt=Date.UTC(q,0,1)/1000;if(tt>=t0)txt(String(q),X(tt),bt+4,{size:6,color:C.mut,align:'center'})});
   rect(M+8,y+ht-14,10,2,C.ln);txt('Preço mensal',M+22,y+ht-18,{size:6.8,color:C.mut});rect(M+90,y+ht-14,10,2,C.intr);txt('Valor intrínseco Graham, vigente a partir da publicação de cada balanço anual',M+104,y+ht-18,{size:6.8,color:C.mut})}
  else txt('Sem histórico de preço suficiente.',M+8,y+30,{size:8,color:C.mut});
  y+=ht+10}
 const gw=(CW-8)/2,gh=128;
 grafico(M,y,gw,gh,'Histórico do ROE',c.serie.map(q=>({x:q.ano,y:q.roe!=null?q.roe*100:null})),{f:v=>fmt(v,0)+'%'});
 grafico(M+gw+8,y,gw,gh,'Histórico da margem líquida',c.serie.map(q=>({x:q.ano,y:q.margem!=null?q.margem*100:null})),{f:v=>fmt(v,0)+'%'});
 y+=gh+8;rodape();nova();
 grafico(M,y,gw,gh,'Histórico do dividend yield',c.serie.map(q=>({x:q.ano,y:q.dy!=null?q.dy*100:null})),{f:v=>fmt(v,1)+'%'});
 grafico(M+gw+8,y,gw,gh,'Dívida líquida ('+MO.trim()+')',c.serie.map(q=>({x:q.ano,y:q.dl})),{f:bi,barras:true});
 y+=gh+14;
 sec('Crescimento histórico');
 grafico(M,y,CW,gh,'Lucro líquido ('+MO.trim()+')',c.serie.map(q=>({x:q.ano,y:q.luc})),{f:bi,barras:true});y+=gh+8;
 const kw=(CW-3*8)/4;
 [['CAGR de lucros',cr.lucros,'cagr'],['CAGR do valor de mercado',cr.valorMercado,'cagr'],['CAGR do valor intrínseco',cr.intrinseco,'cagr'],['Retorno total (com dividendos)',cr.totalReturn,'tr']].forEach(([t,v,ch],i)=>{
  const x=M+i*(kw+8);card(x,y,kw,100);wrap(t,x+8,y+6,kw-16,{bold:true,size:7.6,lead:9.5});gauge(ch,v,null,x+kw/2,y+28,30);
  txt(pct(v)+' ao ano',x+kw/2,y+76,{bold:true,size:9,align:'center',color:v>0?C.ok:v<0?C.neg:C.mut})});
 y+=110;
 {const ult=c.serie[c.serie.length-1],med=media(c.serie.slice(-5).map(q=>q.dps||0)),qtd=Number(pos?.q)||0;
  grafico(M,y,CW,gh,'Dividendos por ação ('+MO.trim()+' por ano)',c.serie.map(q=>({x:q.ano,y:q.dps||0})),{f:v=>fmt(v,2),barras:true});y+=gh+6;
  txt('Média 5 anos: '+MO+fmt(med,2)+'   ·   Payout '+(ult?.ano||'')+': '+pct(ult?.payout)+(qtd?'   ·   Você recebe (média, '+qtd+' ações): '+MO+fmt(med*qtd,2)+'/ano':''),M,y,{size:8.4,max:CW});y+=16}
 // Tabela anual
 sec('Dados anuais usados no cálculo');
 const cols=[['Ano',30],['Receita',62],['Lucro',62],['Patrimônio',66],['ROE',44],['Margem',44],['Dív. líq.',62],['Preço',52],['DY',40]];
 let x=M;cols.forEach(([n,wd],i)=>{txt(n,i?x+wd:x,y,{bold:true,size:7.2,color:C.mut,align:i?'right':'left'});x+=wd});y+=12;lin(M,y,W-M,y);y+=4;
 for(const q of c.serie){if(y>H-50){rodape();nova()}
  x=M;[String(q.ano),bi(q.rec),bi(q.luc),bi(q.pl),pct(q.roe),pct(q.margem),bi(q.dl),q.preco==null?'—':fmt(q.preco,2),pct(q.dy)].forEach((v,i)=>{const wd=cols[i][1];txt(v,i?x+wd:x,y,{size:7.4,align:i?'right':'left'});x+=wd});y+=12}
 y+=6;wrap('Valores em '+MO.trim()+' extraídos dos relatórios anuais ('+(us?'10-K/20-F da SEC':'DFP da CVM')+'). O valor intrínseco usa a fórmula de Graham e serve só como referência educativa; confira o documento original antes de qualquer decisão.',M,y,CW,{size:7.2,color:C.mut});
 rodape();
 return {blob:new Blob([await doc.save()],{type:'application/pdf'}),name:'Historico-'+tk+'-'+new Date().toISOString().slice(0,10)+'.pdf',pages:doc.getPageCount()};
}
async function salvar(tk,c,meta,pos,ticket=null){
 try{const pdf=await gerar(tk,c,meta,pos);
  if(w.DiarioPDFiOS?.deliver)return await w.DiarioPDFiOS.deliver(pdf,'Avaliação histórica '+tk+' — Diário de Trader',ticket);
  const url=URL.createObjectURL(pdf.blob),a=document.createElement('a');a.href=url;a.download=pdf.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),300000);return {pages:pdf.pages};
 }catch(e){ticket?.close?.();throw e}
}
w.DiarioHistoricoPDF={gerar,salvar};
})(window);
