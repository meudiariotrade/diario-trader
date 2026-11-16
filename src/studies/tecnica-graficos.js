/* Diagramas SVG calculados localmente, independentes dos dados de mercado. */
;(function(){
'use strict';
const T=window.TecnicaPratica;
T.escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=T.escape,Y=p=>335-(p-84)*7.5;
const line=(x1,p1,x2,p2,color,dash='')=>`<line x1="${x1}" y1="${Y(p1)}" x2="${x2}" y2="${Y(p2)}" stroke="${color}" stroke-width="2" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
const label=(x,p,s,color='#B7C0CF')=>`<text x="${x}" y="${Y(p)-7}" fill="${color}" font-size="13">${E(s)}</text>`;
function path(points,color='#B7C0CF',dash=''){return `<polyline points="${points.map(([x,p])=>x+','+Y(p)).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;}
function candle(x,o,h,l,c,w=18){const col=c>=o?'#10B981':'#EF4444';return line(x,l,x,h,col)+`<rect x="${x-w/2}" y="${Y(Math.max(o,c))}" width="${w}" height="${Math.max(2,Math.abs(Y(o)-Y(c)))}" fill="${col}"/>`;}
function sma(a,n){return a.map((_,i)=>i<n-1?null:a.slice(i-n+1,i+1).reduce((s,v)=>s+v,0)/n);}
function ema(a,n){const k=2/(n+1);let v=a[0];return a.map(p=>(v=p*k+v*(1-k)));}
function moving(kind){
 const prices=Array.from({length:240},(_,i)=>89+i*.045+Math.sin(i/8)*.6);
 for(let i=210;i<240;i++)prices[i]=98+(i-210)*.055+Math.sin((i-210)/3)*.75;
 const draw=a=>a.slice(-40).map((p,i)=>[50+i*13,p]).filter(p=>p[1]!=null);
 let s=path(draw(prices));
 const sets=kind==='alignment'?[[9,ema,'#D4A017','MME9'],[20,sma,'#6DA5FF','SMA20'],[50,sma,'#C49AEB','SMA50'],[200,sma,'#9AA4B2','SMA200']]:[[9,ema,'#D4A017','EMA9'],[20,sma,'#6DA5FF','SMA20']];
 sets.forEach(([n,fn,col,name],i)=>{s+=path(draw(fn(prices,n)),col)+`<text x="${55+i*132}" y="40" fill="${col}" font-size="13">${name}</text>`;});
 if(kind==='timeframes')s+=label(65,89,'Diário: 20 barras ≈ 1 mês de pregões');
 return s;
}
function candles(kind){
 let s=''; const up=kind==='shooting';
 for(let i=0;i<8;i++){const o=up?98+i*.55:104-i*.7,c=o+(i%3===0?.25:up?.45:-.45);s+=candle(65+i*38,o,Math.max(o,c)+.5,Math.min(o,c)-.6,c,13);}
 if(kind==='hammer')s+=candle(430,97,99,94,98.5,30)+label(377,93,'Pavio inferior');
 if(kind==='shooting')s+=candle(430,102,106,101,101.4,30)+label(385,107,'Pavio superior');
 if(kind==='engulfing')s+=candle(390,98,99,95,96,28)+candle(445,95,99.5,94,99,30)+label(340,92,'Segundo corpo engloba o primeiro');
 if(kind==='inside')s+=candle(390,96,99.7,94,99,35)+candle(445,97,99,95.5,98,20)+label(337,92,'Barra-mãe → barra interna');
 if(kind==='rejection')s+=line(50,96,560,96,'#6DA5FF','5 4')+candle(430,96.2,99.5,94,99,30)+label(55,96,'Suporte recuperado');
 s+=candle(520,99,100.5,98.5,100.2,20);return s;
}
const shapes={
 hstop:[[50,100],[115,105],[180,100],[270,112],[360,100],[440,105],[510,100]],
 hsbottom:[[50,100],[115,95],[180,100],[270,88],[360,100],[440,95],[510,100]],
 doubletop:[[50,101],[150,112],[280,100],[400,112],[510,100]],
 doublebottom:[[50,99],[150,88],[280,100],[400,88],[510,100]],
 triangle:[[50,88],[130,100],[210,91],[290,98],[370,93],[450,96],[510,95],[560,100]],
 flag:[[50,88],[140,94],[210,100],[280,98],[340,99],[400,94],[470,97],[520,96],[560,100]]
};
function pattern(l){
 let s=path(shapes[l.chart]);
 if(['hstop','hsbottom','doubletop','doublebottom'].includes(l.chart))s+=line(50,100,575,100,'#6DA5FF','5 4')+label(50,100,/^hs/.test(l.chart)?'Linha de pescoço':'Linha de confirmação');
 if(l.chart==='triangle')s+=line(50,88,540,95,'#6DA5FF')+line(130,100,540,95,'#6DA5FF');
 if(l.chart==='flag')s+=line(210,100,520,96,'#6DA5FF')+line(280,98,520,92,'#6DA5FF')+label(55,86,'Mastro');
 const low=l.side==='sell'?100:88,high=l.side==='sell'?112:100;
 s+=line(25,low,25,high,'#D4A017')+line(18,low,32,low,'#D4A017')+line(18,high,32,high,'#D4A017')+label(38,(low+high)/2,'12 pts','#D4A017');
 return s;
}
function indicators(l){
 let points=[[50,96],[100,97],[150,96],[200,98],[250,97],[300,99],[350,97],[400,99],[450,98],[510,100],[560,101]],s='';
 if(l.chart==='rsi')points=[[50,100],[150,104],[240,101],[350,105],[450,102],[530,100]];
 s+=path(points);
 if(l.chart==='vwap')s+=path([[50,96],[120,96.4],[200,97],[300,97.3],[400,97.8],[560,98.4]],'#D4A017')+label(55,95,'VWAP de sessão','#D4A017');
 if(l.chart==='bollinger'){
  s+=path(points.map(([x,p],i)=>[x,p+(i>8?2.6:1.1)]),'#6DA5FF')+path(points.map(([x,p],i)=>[x,p-(i>8?2.6:1.1)]),'#6DA5FF')+label(60,91,'Contração → expansão');
 }
 if(l.chart==='volume'){
  const vol=[30,25,40,27,30,45,40,33,42,40,72];
  vol.forEach((v,i)=>s+=`<rect x="${50+i*48}" y="${425-v}" width="22" height="${v}" fill="${i===10?'#D4A017':'#576274'}"/>`);
  s+=`<text x="610" y="395" fill="#D4A017" font-size="13">RVOL: 180 / 100 = 1,8</text>`;
 }
 if(l.chart==='rsi'){
  s+=path([[150,104],[350,105]],'#D4A017','4 3');
  s+=`<polyline points="50,410 150,368 240,405 350,384 450,411 530,420" fill="none" stroke="#C49AEB" stroke-width="2"/><path d="M150 368 L350 384" stroke="#D4A017" stroke-width="2" stroke-dasharray="4 3"/><text x="600" y="385" fill="#C49AEB" font-size="13">RSI: 74 → 62</text><text x="600" y="407" fill="#B7C0CF" font-size="12">Topos nos mesmos instantes</text>`;
 }
 return s;
}
T.chart=(l,step)=>{
 let s=`<svg viewBox="0 0 900 450" role="img" aria-label="${E(l.title)}: esquema com entrada ${l.entry}, stop ${l.stop} e alvo ${l.target}. Exemplo hipotético."><title>${E(l.title)} — exemplo hipotético, sem dados de mercado</title><rect width="900" height="450" fill="#0A0C10"/>`;
 for(const p of [88,94,100,106,112])s+=line(40,p,880,p,'#1E232E')+label(845,p,p.toFixed(2).replace('.',','),'#8491A4');
 if(['averages','alignment','timeframes'].includes(l.chart))s+=moving(l.chart);
 else if(shapes[l.chart])s+=pattern(l);
 else if(['volume','vwap','rsi','bollinger'].includes(l.chart))s+=indicators(l);
 else s+=candles(l.chart);
 const entries=[[1,l.entry,'Gatilho','#D4A017'],[2,l.stop,'Stop técnico','#EF4444'],[3,l.target,'Alvo projetado','#10B981']];
 for(const [n,p,name,col] of entries)if(step>=n)s+=line(45,p,825,p,col,'5 4')+label(640,p,`${name} · ${p.toFixed(2).replace('.',',')}`,col);
 if(step>=3){s+=path([[570,100],[620,l.side==='sell'?98:102],[660,l.target]],'#10B981','6 5')+line(610,100,610,l.target,'#10B981')+label(625,(100+l.target)/2,'Projeção: 12 pts','#10B981');}
 s+=`<text x="45" y="443" fill="#8491A4" font-size="12">Histórico esquemático · tracejado após gatilho = hipótese futura</text></svg>`;
 return s;
};
T.math={sma,ema};
})();
