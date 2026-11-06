/* Diário de Trader v429 — Capas do Jornal do Pregão
 * Gera capas aleatórias (1080 × 1350, formato de post) a partir da edição do dia e das cotações reais:
 *   VERSUS (dois ativos lado a lado) · PERGUNTA DO DIA (manchete) · NÚMERO DO DIA (maior variação)
 *   3 PONTOS (matérias da edição) · TOURO × URSO (quem sobe e quem cai)
 * Só usa textos da edição e números das fontes do app; nenhum rosto ou pessoa real é desenhado. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const W=1080,H=1350;
const NAVY1='#050d1c',NAVY2='#0b1f3a',GOLD='#e9c24f',WHITE='#ffffff',GREEN='#19c37d',RED='#ef4b4b',MUTED='#a9b8cc';
const COND='"HelveticaNeue-CondensedBlack","Helvetica Neue Condensed Black","Arial Narrow Bold","Roboto Condensed","Oswald",Impact,"Arial Black",sans-serif';
const SANS='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

/* ---------- dados ---------- */
const ATIVOS=[['^BVSP','IBOVESPA',0],['^GSPC','S&P 500',0],['^IXIC','NASDAQ',0],['ES=F','S&P FUTURO',0],['NQ=F','NASDAQ FUTURO',0],['BRL=X','DÓLAR',4],['DX-Y.NYB','DXY',2],
 ['BZ=F','PETRÓLEO',2],['GC=F','OURO',0],['BTC-USD','BITCOIN',0],['ETH-USD','ETHEREUM',0],['TIO=F','MINÉRIO',2],['^N225','NIKKEI',0],['^GDAXI','DAX',0]];
function q(sym){return g(()=>{const x=root.imgQ?root.imgQ(sym):null;return x&&Number.isFinite(+x.px)?{px:+x.px,d1:Number.isFinite(+x.d1)?+x.d1:null}:null},null)}
function cotacoes(){return ATIVOS.map(([s,n,d])=>({s,n,d,q:q(s)})).filter(x=>x.q)}
function edicao(){return g(()=>root.jrVer&&root.jrVer(),null)||g(()=>JRN.v,null)}
const nf=(v,d)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=v=>v==null?'—':(v>0?'+':'')+nf(v,2)+'%';
const pickR=a=>a[Math.floor(Math.random()*a.length)];
function dataTxt(){return new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Sao_Paulo'})}

/* ---------- desenho ---------- */
function fundo(c,seed){
  const gr=c.createLinearGradient(0,0,W,H);gr.addColorStop(0,NAVY2);gr.addColorStop(.55,NAVY1);gr.addColorStop(1,'#071630');
  c.fillStyle=gr;c.fillRect(0,0,W,H);
  // candles ao fundo (passeio aleatório, só decorativo)
  c.save();c.globalAlpha=.14;let v=H*.42;
  for(let i=0;i<46;i++){
    const x=20+i*23,o=v;v+=(Math.random()-.5)*42;const hi=Math.min(o,v)-Math.random()*26,lo=Math.max(o,v)+Math.random()*26;
    c.strokeStyle=c.fillStyle=v<o?GREEN:RED;c.fillRect(x-1,hi,2,lo-hi);c.fillRect(x-7,Math.min(o,v),14,Math.max(4,Math.abs(v-o)));
  }
  c.restore();
  // faixas verde e amarelo nos cantos
  c.save();c.globalAlpha=.9;
  [[GREEN,0],[GOLD,26],['#1d4ed8',52]].forEach(([cor,o])=>{
    c.fillStyle=cor;c.beginPath();c.moveTo(0,H-260+o);c.lineTo(170-o,H);c.lineTo(150-o,H);c.lineTo(0,H-235+o);c.closePath();c.fill();
    c.beginPath();c.moveTo(W,H-260+o);c.lineTo(W-170+o,H);c.lineTo(W-150+o,H);c.lineTo(W,H-235+o);c.closePath();c.fill();
  });
  c.restore();
  // vinheta
  const vg=c.createRadialGradient(W/2,H*.45,200,W/2,H*.45,900);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=vg;c.fillRect(0,0,W,H);
}
function marca(c){
  c.save();c.fillStyle=GOLD;c.fillRect(W/2-330,H-70,200,2);c.fillRect(W/2+130,H-70,200,2);
  c.fillStyle=WHITE;c.font=`800 30px ${SANS}`;c.textAlign='center';c.fillText('DIÁRIO DE TRADER',W/2,H-60);
  c.fillStyle=MUTED;c.font=`500 18px ${SANS}`;c.fillText('Jornal do Pregão · '+dataTxt()+' · não é recomendação de investimento',W/2,H-28);
  c.restore();
}
/* quebra em linhas e reduz a fonte até caber em maxW × maxLinhas */
function caber(c,txt,maxW,tam,maxLinhas,peso,fam){
  const palavras=String(txt||'').toUpperCase().split(/\s+/).filter(Boolean);
  for(let s=tam;s>=40;s-=4){
    c.font=`${peso} ${s}px ${fam}`;const linhas=[];let l='';
    for(const p of palavras){const t=l?l+' '+p:p;if(c.measureText(t).width>maxW&&l){linhas.push(l);l=p}else l=t}
    if(l)linhas.push(l);
    if(linhas.length<=maxLinhas&&linhas.every(x=>c.measureText(x).width<=maxW))return {s,linhas};
  }
  c.font=`${peso} 40px ${fam}`;return {s:40,linhas:[String(txt).toUpperCase().slice(0,60)]};
}
function titulo(c,txt,y,cor,tam=150,maxL=2){
  const r=caber(c,txt,W-140,tam,maxL,'900',COND);
  c.save();c.textAlign='center';c.fillStyle=cor;c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=18;c.font=`900 ${r.s}px ${COND}`;
  r.linhas.forEach((l,i)=>c.fillText(l,W/2,y+i*r.s*1.02));c.restore();return y+r.linhas.length*r.s*1.02;
}
function linhaFina(c,txt,y,max=3){
  if(!txt)return y;c.save();c.fillStyle='#d9e3f0';c.textAlign='center';c.font=`500 30px ${SANS}`;
  const ps=String(txt).split(/\s+/),ls=[];let l='';for(const p of ps){const t=l?l+' '+p:p;if(c.measureText(t).width>W-200&&l){ls.push(l);l=p}else l=t}if(l)ls.push(l);
  ls.slice(0,max).forEach((x,i)=>c.fillText(i===max-1&&ls.length>max?x+'…':x,W/2,y+i*42));c.restore();return y+Math.min(ls.length,max)*42;
}
function spark(c,x,y,w,h,up){
  // linha ilustrativa da direção do dia (não é o histórico real)
  c.save();c.strokeStyle=up?GREEN:RED;c.lineWidth=6;c.lineJoin='round';c.shadowColor=up?GREEN:RED;c.shadowBlur=16;c.beginPath();
  let v=up?y+h*.8:y+h*.2;for(let i=0;i<=14;i++){const px=x+i*w/14;v+=(up?-1:1)*h*.045+(Math.random()-.5)*h*.12;v=Math.max(y,Math.min(y+h,v));i?c.lineTo(px,v):c.moveTo(px,v)}
  c.stroke();c.restore();
}
function chip(c,txt,x,y,cor){c.save();c.font=`800 34px ${SANS}`;const w=c.measureText(txt).width+44;c.fillStyle=cor;c.beginPath();c.roundRect?c.roundRect(x-w/2,y-44,w,62,14):c.rect(x-w/2,y-44,w,62);c.fill();c.fillStyle='#08131f';c.textAlign='center';c.fillText(txt,x,y);c.restore()}

/* ---------- modelos ---------- */
const PERGUNTAS_VS=['QUEM VENCE HOJE?','QUEM PUXA O MERCADO?','A HISTÓRIA PODE SE REPETIR?','PARA ONDE VAI O DINHEIRO?','QUEM DITA O RITMO?'];
function mVersus(c,cot,ed){
  const pares=[['^BVSP','^GSPC'],['BRL=X','^BVSP'],['BZ=F','^BVSP'],['BTC-USD','GC=F'],['^GSPC','^IXIC'],['DX-Y.NYB','GC=F']];
  const disp=pares.filter(([a,b])=>cot.some(x=>x.s===a)&&cot.some(x=>x.s===b));
  const [sa,sb]=disp.length?pickR(disp):[cot[0]?.s,cot[1]?.s];
  const A=cot.find(x=>x.s===sa),B=cot.find(x=>x.s===sb);if(!A||!B)return false;
  fundo(c);
  // linha de luz central
  const lg=c.createLinearGradient(0,0,0,H);lg.addColorStop(0,'rgba(233,194,79,0)');lg.addColorStop(.3,GOLD);lg.addColorStop(.7,GOLD);lg.addColorStop(1,'rgba(233,194,79,0)');
  c.save();c.fillStyle=lg;c.shadowColor=GOLD;c.shadowBlur=30;c.fillRect(W/2-2,40,4,H*.62);c.restore();
  const lado=(X,x)=>{
    const r=caber(c,X.n,W/2-120,110,2,'900',COND);c.save();c.textAlign='center';c.fillStyle=WHITE;c.font=`900 ${r.s}px ${COND}`;r.linhas.forEach((l,i)=>c.fillText(l,x,290+i*r.s));c.restore();
    spark(c,x-190,450,380,240,(X.q.d1||0)>=0);
    c.save();c.textAlign='center';c.fillStyle=WHITE;c.font=`800 64px ${SANS}`;c.fillText(nf(X.q.px,X.d),x,790);c.restore();
    chip(c,pct(X.q.d1),x,880,(X.q.d1||0)>=0?GREEN:RED);
  };
  lado(A,W/4);lado(B,W*3/4);
  c.save();c.textAlign='center';c.font=`900 96px ${COND}`;const vw=c.measureText('VERSUS').width;c.fillStyle=NAVY1;c.fillRect(W/2-vw/2-20,70,vw+40,100);c.fillStyle=GOLD;c.fillText('VERSUS',W/2,150);c.restore();
  const p=pickR(PERGUNTAS_VS),parts=p.split(' '),meio=Math.ceil(parts.length/2);
  let y=titulo(c,parts.slice(0,meio).join(' '),1035,WHITE,120,1);titulo(c,parts.slice(meio).join(' '),y,GOLD,130,1);
  marca(c);return true;
}
function mPergunta(c,cot,ed){
  const m=ed&&ed.manchete;if(!m||!m.titulo)return false;
  fundo(c);
  c.save();c.textAlign='center';c.fillStyle=GOLD;c.font=`800 34px ${SANS}`;c.fillText(String(m.editoria||'MANCHETE DO DIA').toUpperCase(),W/2,150);c.restore();
  const ib=cot.find(x=>x.s==='^BVSP')||cot[0];
  if(ib)spark(c,140,230,W-280,330,(ib.q.d1||0)>=0);
  let y=titulo(c,m.titulo,700,WHITE,118,4);
  y=linhaFina(c,m.linha_fina||m.por_que_importa,y+20,3);
  if(ib){c.save();c.textAlign='center';c.fillStyle=MUTED;c.font=`600 28px ${SANS}`;c.fillText(`${ib.n} ${nf(ib.q.px,ib.d)} (${pct(ib.q.d1)})`,W/2,Math.min(y+60,H-130));c.restore()}
  marca(c);return true;
}
function mNumero(c,cot,ed){
  const mov=cot.filter(x=>x.q.d1!=null).sort((a,b)=>Math.abs(b.q.d1)-Math.abs(a.q.d1))[0];if(!mov)return false;
  fundo(c);const up=mov.q.d1>=0;
  c.save();c.textAlign='center';c.fillStyle=GOLD;c.font=`900 86px ${COND}`;c.fillText('O NÚMERO DO DIA',W/2,190);c.restore();
  c.save();c.textAlign='center';c.fillStyle=up?GREEN:RED;c.shadowColor=up?GREEN:RED;c.shadowBlur=40;
  const t=pct(mov.q.d1);const r=caber(c,t,W-120,330,1,'900',COND);c.font=`900 ${r.s}px ${COND}`;c.fillText(t,W/2,560);c.restore();
  let y=titulo(c,mov.n,700,WHITE,130,1);
  c.save();c.textAlign='center';c.fillStyle='#d9e3f0';c.font=`700 52px ${SANS}`;c.fillText(nf(mov.q.px,mov.d),W/2,y+30);c.restore();
  const frase=g(()=>ed.em_poucas_linhas[0],'')||(up?'A maior alta entre os mercados acompanhados hoje.':'A maior queda entre os mercados acompanhados hoje.');
  linhaFina(c,frase,y+120,3);
  marca(c);return true;
}
function mPontos(c,cot,ed){
  const ms=g(()=>[ed.manchete,...(ed.materias||[])].filter(x=>x&&x.titulo).slice(0,3),[]);if(ms.length<3)return false;
  fundo(c);
  let y=titulo(c,'3 coisas que mexem',150,WHITE,120,1);y=titulo(c,'com o mercado hoje',y,GOLD,120,1);
  y+=40;
  ms.forEach((m,i)=>{
    c.save();c.fillStyle=GOLD;c.font=`900 150px ${COND}`;c.textAlign='left';c.fillText(String(i+1),80,y+120);c.restore();
    const r=caber(c,m.titulo,W-300,64,3,'800',SANS);
    c.save();c.fillStyle=WHITE;c.font=`800 ${r.s}px ${SANS}`;c.textAlign='left';r.linhas.forEach((l,k)=>c.fillText(l,210,y+40+k*r.s*1.12));
    c.fillStyle=GOLD;c.font=`700 24px ${SANS}`;c.fillText(String(m.editoria||'').toUpperCase(),210,y+40+r.linhas.length*r.s*1.12+6);c.restore();
    y+=Math.max(190,r.linhas.length*r.s*1.12+90);
    if(i<2){c.fillStyle='rgba(233,194,79,.35)';c.fillRect(80,y-30,W-160,2)}
  });
  marca(c);return true;
}
function mTouro(c,cot,ed){
  const com=cot.filter(x=>x.q.d1!=null);const alta=com.filter(x=>x.q.d1>0).sort((a,b)=>b.q.d1-a.q.d1).slice(0,4),baixa=com.filter(x=>x.q.d1<0).sort((a,b)=>a.q.d1-b.q.d1).slice(0,4);
  if(!alta.length||!baixa.length)return false;
  fundo(c);
  c.save();c.globalAlpha=.22;c.fillStyle=GREEN;c.fillRect(0,0,W/2,H);c.fillStyle=RED;c.fillRect(W/2,0,W/2,H);c.restore();
  const rt=caber(c,'TOURO',W/2-120,150,1,'900',COND);
  c.save();c.textAlign='center';c.font=`900 ${rt.s}px ${COND}`;c.fillStyle=GREEN;c.fillText('TOURO',W/4,230);c.fillStyle=RED;c.fillText('URSO',W*3/4,230);
  c.fillStyle=GOLD;c.font=`900 70px ${COND}`;c.fillText('×',W/2,205);c.restore();
  const col=(xs,x,cor)=>xs.forEach((a,i)=>{const y=370+i*150;c.save();c.textAlign='center';c.fillStyle=WHITE;c.font=`800 44px ${SANS}`;c.fillText(a.n,x,y);c.fillStyle=cor;c.font=`900 58px ${COND}`;c.fillText(pct(a.q.d1),x,y+62);c.restore()});
  col(alta,W/4,GREEN);col(baixa,W*3/4,RED);
  const pergunta=alta.length>=baixa.length?['OS COMPRADORES','MANDAM HOJE?']:['QUEM VAI','SEGURAR A QUEDA?'];
  const y=titulo(c,pergunta[0],1040,WHITE,110,1);titulo(c,pergunta[1],y,GOLD,120,1);
  marca(c);return true;
}
const MODELOS=[['versus',mVersus],['pergunta',mPergunta],['numero',mNumero],['pontos',mPontos],['touro',mTouro]];
let ultimo='';
function gerar(so){
  const cv=doc.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');if(!c)return null;
  const cot=cotacoes(),ed=edicao();
  const ordem=so?MODELOS.filter(([k])=>k===so):MODELOS.filter(([k])=>k!==ultimo).sort(()=>Math.random()-.5);
  for(const [k,f] of ordem){c.clearRect(0,0,W,H);try{if(f(c,cot,ed)){ultimo=k;return cv}}catch(e){console.warn('capa',k,e)}}
  return null;
}

/* ---------- janela: ver, gerar outra, compartilhar ---------- */
async function compartilhar(cv){
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob){g(()=>toast('Não consegui gerar a imagem.'));return}
  const nome='capa-jornal-'+new Date().toISOString().slice(0,10)+'.png';
  try{const f=new File([blob],nome,{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Capa do Jornal do Pregão'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=doc.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;doc.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);g(()=>toast('Imagem salva.'));
}
let atual=null;
function abrir(){
  atual=gerar();
  if(!atual){g(()=>toast('Abra o Jornal do Pregão e aguarde as cotações para gerar a capa.'),null);return}
  let ov=doc.getElementById('v429-capa');
  if(!ov){ov=doc.createElement('div');ov.id='v429-capa';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Capa do Jornal do Pregão');doc.body.appendChild(ov)}
  ov.innerHTML=`<div class="v429-bar"><button type="button" data-v429="x">← Voltar</button><button type="button" data-v429="nova">🎲 Outra capa</button><button type="button" data-v429="s" class="v429-pri">Compartilhar / salvar</button></div><div class="v429-img"><img alt="Capa gerada para o Jornal do Pregão" src="${atual.toDataURL('image/png')}"></div><p class="v429-nota">Capa montada com a edição de hoje e as cotações do app. Toque em “Outra capa” para sortear outro modelo.</p>`;
  ov.hidden=false;doc.body.classList.add('v429-open');ov.querySelector('[data-v429="nova"]').focus({preventScroll:true});
}
function fechar(){const ov=doc.getElementById('v429-capa');if(ov)ov.hidden=true;doc.body.classList.remove('v429-open')}
doc.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-v429]');
  if(b){e.preventDefault();const a=b.dataset.v429;if(a==='x')fechar();else if(a==='nova')abrir();else if(a==='s'&&atual)compartilhar(atual);return}
  if(e.target.closest?.('[data-v429-capa]')){e.preventDefault();abrir()}
});
doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&doc.body.classList.contains('v429-open'))fechar()});

/* botão "Capa do dia" ao lado do botão de imagem do Jornal */
function botao(){
  doc.querySelectorAll('[data-jrimg]').forEach(b=>{
    if(b.parentElement&&!b.parentElement.querySelector('[data-v429-capa]')){
      const n=doc.createElement('button');n.type='button';n.className=b.className+' v429-btn';n.setAttribute('data-v429-capa','1');n.textContent='🎲 Capa do dia';b.after(n);
    }
  });
}
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v429)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{botao()}catch(e){}return o};f.__v429=1;root.render0=f;return true;
}
hook();let k=0;const iv=setInterval(()=>{k++;hook();try{botao()}catch(e){}if(k>15)clearInterval(iv)},800);
setInterval(()=>{if(!doc.hidden)try{botao()}catch(e){}},3000);
root.DIARIO_V429={gerar,abrir};
})(window);
