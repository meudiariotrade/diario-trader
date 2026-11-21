/* v847 — Avaliação histórica (10 anos): balanços da CVM + preço mensal, servidos pela Cloudflare.
   Todo cálculo é feito no aparelho; o Supabase não é consultado. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.DiarioHistoricoFundamentos=api;})(typeof globalThis==='undefined'?this:globalThis,function(w){
 'use strict';
 const BASE='https://diario-screeners-quant.lucianosilva43567.workers.dev';
 const K='diario-hist-fund-v847',TTL=24*3600e3;
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(v,c=1)=>v==null||!Number.isFinite(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});
 const pct=(v,c=1)=>v==null||!Number.isFinite(v)?'—':fmt(v*100,c)+'%';
 const bi=v=>v==null||!Number.isFinite(v)?'—':Math.abs(v)>=1e9?fmt(v/1e9,1)+' bi':fmt(v/1e6,0)+' mi';
 const div=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b!==0?a/b:null;
 const media=xs=>{const v=xs.filter(Number.isFinite);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};
 const cagr=(a,b,n)=>Number.isFinite(a)&&Number.isFinite(b)&&a>0&&b>0&&n>0?Math.pow(b/a,1/n)-1:null;

 /* ---------- cálculo puro ---------- */
 function calcular(hist,precos){
  const anos=Object.keys(hist?.anos||{}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const meses=(precos?.meses||[]).map(([t,c,a])=>({t,ano:new Date(t*1000).getUTCFullYear(),c,a}));
  const fimAno=ano=>{const m=meses.filter(x=>x.ano===ano);return m.length?m[m.length-1]:null};
  const dps=ano=>(precos?.dividendos||[]).filter(([t])=>new Date(t*1000).getUTCFullYear()===ano).reduce((s,[,v])=>s+v,0);
  const ult=anos.length?hist.anos[anos[anos.length-1]]:null,acoesHoje=ult?.acoes>0?ult.acoes:null;
  const serie=anos.map(ano=>{const x=hist.anos[ano]||{},p=fimAno(ano),dl=Number.isFinite(x.div)?x.div-(x.cx||0):null;
   const intr=x.luc>0&&x.pl>0&&acoesHoje?Math.sqrt(22.5*x.luc*x.pl)/acoesHoje:null,d=dps(ano);
   return {ano,rec:x.rec??null,luc:x.luc??null,pl:x.pl??null,dl,dvd:x.dvd??null,acoes:x.acoes??null,
    roe:div(x.luc,x.pl),margem:div(x.luc,x.rec),dlpl:dl==null?null:div(dl,x.pl),payout:div(x.dvd,x.luc),
    preco:p?.c??null,dy:p&&d>0?d/p.c:p?0:null,dps:d||null,intrinseco:intr,
    valorMercado:p&&acoesHoje?p.c*acoesHoje:null}});
  const hoje=meses.length?meses[meses.length-1]:null,u=serie[serie.length-1]||{};
  const d12=(()=>{if(!hoje)return null;const lim=hoje.t-365*86400;return (precos?.dividendos||[]).filter(([t])=>t>lim).reduce((s,[,v])=>s+v,0)})();
  const atual={roe:u.roe,margem:u.margem,dlpl:u.dlpl,dy:hoje&&d12!=null?d12/hoje.c:u.dy,preco:hoje?.c??null,intrinseco:u.intrinseco};
  const hist5=serie.slice(0,-1);
  const historico={roe:media(hist5.map(x=>x.roe)),margem:media(hist5.map(x=>x.margem)),dlpl:media(hist5.map(x=>x.dlpl)),dy:media(hist5.map(x=>x.dy))};
  const n=serie.length-1,pri=serie[0]||{},a1=meses[0],an=hoje;
  const anosPreco=a1&&an?(an.t-a1.t)/(365.25*86400):0;
  const crescimento={
   lucros:cagr(pri.luc,u.luc,n),receita:cagr(pri.rec,u.rec,n),
   valorMercado:a1&&an?cagr(a1.c,an.c,anosPreco):null,
   intrinseco:cagr(serie.find(x=>x.intrinseco)?.intrinseco,u.intrinseco,n),
   totalReturn:a1?.a&&an?.a?cagr(a1.a,an.a,anosPreco):null,
   totalReturnAcum:a1?.a&&an?.a?an.a/a1.a-1:null};
  const desconto=atual.preco&&atual.intrinseco?atual.preco/atual.intrinseco-1:null;
  return {serie,atual,historico,crescimento,desconto,meses,anos};
 }

 /* ---------- desenho (SVG) ---------- */
 const ZONAS={roe:[0,.25,[.08,.15],1],margem:[0,.25,[.05,.12],1],dy:[0,.12,[.04,.07],1],dlpl:[-.5,2,[.5,1],-1],cagr:[-.2,.35,[0,.1],1],tr:[-.2,.35,[.05,.12],1]};
 function velocimetro(chave,valor,ref,rotulo){
  const [min,max,[a,b],dir]=ZONAS[chave],W=200,H=118,cx=100,cy=100,R=78,ang=v=>Math.PI*(1-Math.min(1,Math.max(0,(v-min)/(max-min))));
  const pt=(v,r)=>[cx+r*Math.cos(ang(v)),cy-r*Math.sin(ang(v))];
  const arco=(v1,v2,cl)=>{const [x1,y1]=pt(v1,R),[x2,y2]=pt(v2,R);return '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' A'+R+' '+R+' 0 0 1 '+x2.toFixed(1)+' '+y2.toFixed(1)+'" class="'+cl+'"/>'};
  const zs=dir>0?[[min,a,'neg'],[a,b,'at'],[b,max,'ok']]:[[min,a,'ok'],[a,b,'at'],[b,max,'neg']];
  const agulha=Number.isFinite(valor)?(()=>{const [x,y]=pt(valor,R-14);return '<line x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" class="ag"/>'})():'';
  const marca=Number.isFinite(ref)?(()=>{const [x1,y1]=pt(ref,R-9),[x2,y2]=pt(ref,R+9);return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" class="ref"/>'})():'';
  return '<svg viewBox="0 0 '+W+' '+H+'" class="hf-gauge" role="img" aria-label="'+E(rotulo)+'">'+zs.map(z=>arco(z[0],z[1],z[2])).join('')+marca+agulha+'<circle cx="'+cx+'" cy="'+cy+'" r="5" class="pino"/></svg>';
 }
 function cartaoIndicador(chave,titulo,atual,ref,f){
  const melhor=Number.isFinite(atual)&&Number.isFinite(ref)?(ZONAS[chave][3]>0?atual>=ref:atual<=ref):null;
  const delta=Number.isFinite(atual)&&Number.isFinite(ref)?atual-ref:null;
  return '<div class="hf-card"><h4>'+titulo+'</h4>'+velocimetro(chave,atual,ref,titulo)+
   '<p class="hf-tend '+(melhor==null?'':melhor?'ok':'neg')+'">'+(melhor==null?'Sem comparação':(melhor?'Melhorando ':'Piorando ')+(delta>0?'+':'')+f(delta))+'</p>'+
   '<div class="hf-pares"><span><small>Histórico</small><b>'+f(ref)+'</b></span><span><small>Atual</small><b>'+f(atual)+'</b></span></div></div>';
 }
 function linha(pontos,{fmtY=v=>fmt(v,1),barras=false,cls=''}={}){
  const p=pontos.filter(x=>Number.isFinite(x.y));if(p.length<2)return '<p class="hf-vazio">Dados insuficientes.</p>';
  const W=340,H=150,l=44,r=8,t=14,b=22,ys=p.map(x=>x.y),mn=Math.min(0,...ys),mx=Math.max(...ys),sp=mx-mn||1;
  const X=i=>l+(W-l-r)*(p.length===1?.5:i/(p.length-1)),Y=v=>t+(H-t-b)*(1-(v-mn)/sp);
  const grid=[mn,mn+sp/2,mx].map(v=>'<line x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" class="gr"/><text x="'+(l-4)+'" y="'+(Y(v)+3).toFixed(1)+'" text-anchor="end" class="ey">'+E(fmtY(v))+'</text>').join('');
  const xs=p.map((x,i)=>'<text x="'+X(i).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ex">'+E(String(x.x).slice(-2))+'</text>').join('');
  const corpo=barras?p.map((x,i)=>{const w=Math.max(4,(W-l-r)/p.length*.6),y0=Y(0),y1=Y(x.y);return '<rect x="'+(X(i)-w/2).toFixed(1)+'" y="'+Math.min(y0,y1).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(1,Math.abs(y1-y0)).toFixed(1)+'" class="'+(x.y>=0?'bp':'bn')+'"/>'}).join('')
   :'<polyline points="'+p.map((x,i)=>X(i).toFixed(1)+','+Y(x.y).toFixed(1)).join(' ')+'" class="ln '+cls+'"/>'+p.map((x,i)=>'<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(x.y).toFixed(1)+'" r="2.6" class="pt"><title>'+E(x.x+': '+fmtY(x.y))+'</title></circle>').join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="hf-line" role="img">'+grid+corpo+xs+'</svg>';
 }
 /* Preço mensal × valor intrínseco anual (Graham sobre lucro e PL da CVM). */
 function precoIntrinseco(c){
  const m=c.meses.filter(x=>x.c>0);if(m.length<12)return '<p class="hf-vazio">Sem histórico de preço.</p>';
  const ints=c.serie.filter(x=>x.intrinseco>0),W=(w.innerWidth||1200)<700?520:1200,H=(w.innerWidth||1200)<700?260:230,l=46,r=10,t=12,b=22,t0=m[0].t,t1=m[m.length-1].t;
  const vals=m.map(x=>x.c).concat(ints.map(x=>x.intrinseco)),mx=Math.max(...vals)*1.08,mn=0;
  const X=t=>l+(W-l-r)*(t-t0)/(t1-t0||1),Y=v=>t+(H-t-b)*(1-(v-mn)/(mx-mn));
  const preco='<polyline class="ln" points="'+m.map(x=>X(x.t).toFixed(1)+','+Y(x.c).toFixed(1)).join(' ')+'"/>';
  const degraus=ints.map((x,i)=>{const a=Date.UTC(x.ano+1,2,31)/1000,z=ints[i+1]?Date.UTC(ints[i+1].ano+1,2,31)/1000:t1;if(z<t0)return '';
   return '<line x1="'+X(Math.max(a,t0)).toFixed(1)+'" x2="'+X(Math.min(z,t1)).toFixed(1)+'" y1="'+Y(x.intrinseco).toFixed(1)+'" y2="'+Y(x.intrinseco).toFixed(1)+'" class="intr"/>'}).join('');
  const anosX=[...new Set(m.map(x=>x.ano))].filter((a,i,arr)=>i%Math.ceil(arr.length/8)===0).map(a=>{const tt=Date.UTC(a,0,1)/1000;return tt<t0?'':'<text x="'+X(tt).toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" class="ex">'+a+'</text>'}).join('');
  const gy=[0,mx/2,mx].map(v=>'<line x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" class="gr"/><text x="'+(l-4)+'" y="'+(Y(v)+3).toFixed(1)+'" text-anchor="end" class="ey">'+fmt(v,2)+'</text>').join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="hf-line hf-wide" role="img" aria-label="Preço mensal comparado ao valor intrínseco">'+gy+degraus+preco+anosX+'</svg>'+
   '<p class="hf-leg"><i class="lp"></i>Preço (mensal) <i class="li"></i>Valor intrínseco Graham (√22,5 × lucro × PL, por ação de hoje), vale a partir da DFP de cada ano</p>';
 }
 function cagrCard(titulo,v,chave='cagr'){return '<div class="hf-card hf-mini"><h4>'+titulo+'</h4>'+velocimetro(chave,v,null,titulo)+'<div class="hf-pares"><span><small>Ao ano</small><b class="'+(v>0?'ok':v<0?'neg':'')+'">'+pct(v)+'</b></span></div></div>'}
 function dividendosHtml(c,pos){
  const anos=c.serie.filter(x=>x.dps!=null||x.preco!=null);
  const qtd=Number(pos?.q)||0,ult=c.serie[c.serie.length-1],med=media(c.serie.slice(-5).map(x=>x.dps||0));
  return '<div class="hf-card hf-span2"><h4>Dividendos por ação (R$ por ano)</h4>'+linha(anos.map(x=>({x:x.ano,y:x.dps||0})),{barras:true,fmtY:v=>fmt(v,2)})+
   '<div class="hf-pares"><span><small>Média 5 anos</small><b>R$ '+fmt(med,2)+'</b></span><span><small>Payout '+(ult?.ano||'')+'</small><b>'+pct(ult?.payout)+'</b></span>'+
   (qtd?'<span><small>Você recebe (média, '+qtd+' ações)</small><b class="ok">R$ '+fmt(med*qtd,2)+'/ano</b></span>':'')+'</div>'+
   '<p class="hf-leg">Datas-com futuras ainda não são publicadas em fonte aberta confiável; o valor acima é a média paga nos últimos 5 anos.</p></div>';
 }
 function html(tk,c,meta,pos){
  const a=c.atual,h=c.historico,cr=c.crescimento,u=c.serie[c.serie.length-1]||{};
  return '<header class="hf-head"><div><h2>'+E(tk)+' · '+E(meta.nome||'')+'</h2><p>'+E(meta.setor||'')+' · exercícios '+E((meta.exercicios||[]).join('–'))+' · preço R$ '+fmt(a.preco,2)+'</p></div>'+
   '<div class="hf-acoes"><button type="button" class="btn s" data-hf="pdf">Salvar PDF</button><button type="button" class="btn s" data-hf="fechar">Fechar</button></div></header>'+
   '<h3 class="hf-sec">Qualidade histórica · últimos 10 anos</h3>'+
   '<div class="hf-grid hf-g5">'+cartaoIndicador('roe','Rentabilidade (ROE)',a.roe,h.roe,v=>pct(v))+cartaoIndicador('margem','Margem líquida',a.margem,h.margem,v=>pct(v))+
   cartaoIndicador('dy','Dividend yield',a.dy,h.dy,v=>pct(v))+cartaoIndicador('dlpl','Dívida líquida / PL',a.dlpl,h.dlpl,v=>fmt(v,2)+'x')+
   '<div class="hf-card hf-desc"><h4>Preço × valor intrínseco</h4><div class="hf-pares"><span><small>Valor intrínseco</small><b>R$ '+fmt(a.intrinseco,2)+'</b></span><span><small>Preço</small><b>R$ '+fmt(a.preco,2)+'</b></span></div>'+
   '<p class="hf-big '+(c.desconto<0?'ok':'neg')+'">'+(c.desconto==null?'—':(c.desconto<0?'Desconto ':'Ágio ')+pct(Math.abs(c.desconto)))+'</p><p class="hf-leg">Graham sobre o último balanço anual. Estimativa, não recomendação.</p></div></div>'+
   '<div class="hf-card hf-full"><h4>Criação de valor · preço × valor intrínseco</h4>'+precoIntrinseco(c)+'</div>'+
   '<div class="hf-grid hf-g4">'+
   '<div class="hf-card"><h4>Histórico do ROE</h4>'+linha(c.serie.map(x=>({x:x.ano,y:x.roe!=null?x.roe*100:null})),{fmtY:v=>fmt(v,0)+'%'})+'</div>'+
   '<div class="hf-card"><h4>Histórico da margem líquida</h4>'+linha(c.serie.map(x=>({x:x.ano,y:x.margem!=null?x.margem*100:null})),{fmtY:v=>fmt(v,0)+'%'})+'</div>'+
   '<div class="hf-card"><h4>Histórico do dividend yield</h4>'+linha(c.serie.map(x=>({x:x.ano,y:x.dy!=null?x.dy*100:null})),{fmtY:v=>fmt(v,1)+'%'})+'</div>'+
   '<div class="hf-card"><h4>Dívida líquida (R$)</h4>'+linha(c.serie.map(x=>({x:x.ano,y:x.dl})),{fmtY:bi,barras:true})+'</div></div>'+
   '<h3 class="hf-sec">Crescimento histórico</h3>'+
   '<div class="hf-grid hf-g6"><div class="hf-card hf-span2"><h4>Lucro líquido (R$)</h4>'+linha(c.serie.map(x=>({x:x.ano,y:x.luc})),{fmtY:bi,barras:true})+'</div>'+
   cagrCard('CAGR de lucros',cr.lucros)+cagrCard('CAGR do valor de mercado',cr.valorMercado)+cagrCard('CAGR do valor intrínseco',cr.intrinseco)+cagrCard('Retorno total (com dividendos)',cr.totalReturn,'tr')+'</div>'+
   '<div class="hf-grid hf-g2">'+dividendosHtml(c,pos)+'</div>'+
   '<p class="hf-fonte">Fontes: CVM (DFP: DRE, balanço, DFC e composição do capital, '+E((meta.exercicios||[]).join('–'))+'), Yahoo Finance (preço mensal e dividendos). Retorno total acumulado: '+pct(cr.totalReturnAcum,0)+'. Dados atualizados semanalmente. Não é recomendação.</p>';
 }

 /* ---------- carga (Cloudflare + cache local) ---------- */
 function lerCache(k){try{const all=JSON.parse(localStorage.getItem(K)||'{}'),x=all[k];return x&&Date.now()-x.t<TTL?x.v:null}catch{return null}}
 function salvaCache(k,v){try{const all=JSON.parse(localStorage.getItem(K)||'{}');all[k]={t:Date.now(),v};const ks=Object.keys(all).sort((a,b)=>all[b].t-all[a].t);for(const x of ks.slice(40))delete all[x];localStorage.setItem(K,JSON.stringify(all))}catch{}}
 async function obter(rota,signal){const c=lerCache(rota);if(c)return c;const r=await fetch(BASE+rota,{signal});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'HTTP '+r.status);salvaCache(rota,j);return j}
 let ctrl=null;
 function fechar(){ctrl?.abort();ctrl=null;w.document?.getElementById('hf847')?.remove();w.document?.body?.classList.remove('hf-aberto')}
 async function abrir(tk,pos){
  const d=w.document;fechar();ctrl=new AbortController();
  const ov=d.createElement('div');ov.id='hf847';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Avaliação histórica de '+tk);
  ov.innerHTML='<div class="hf-wrap"><p class="hf-vazio">Carregando 10 anos de balanços de '+E(tk)+'…</p><button type="button" class="btn s" data-hf="fechar">Fechar</button></div>';
  d.body.appendChild(ov);d.body.classList.add('hf-aberto');
  try{const [h,p]=await Promise.all([obter('/v1/cvm-historico?ticker='+encodeURIComponent(tk),ctrl.signal),obter('/v1/historico-preco?market=BR&ticker='+encodeURIComponent(tk),ctrl.signal).catch(()=>({meses:[],dividendos:[]}))]);
   if(!ov.isConnected)return;const c=calcular(h,p);w.__hf847={tk,c};
   ov.querySelector('.hf-wrap').innerHTML=html(tk,c,h,pos);
  }catch(e){if(e?.name==='AbortError'||!ov.isConnected)return;
   ov.querySelector('.hf-wrap').innerHTML='<p class="hf-vazio">Não foi possível carregar o histórico: '+E(String(e.message||e).slice(0,140))+'. A base da CVM é atualizada aos sábados.</p><button type="button" class="btn s" data-hf="fechar">Fechar</button>'}
 }
 if(w.document){
  w.document.addEventListener('click',e=>{const b=e.target.closest?.('[data-hf],[data-hf-abrir]');if(!b)return;
   if(b.dataset.hfAbrir){e.preventDefault();const tk=b.dataset.hfAbrir,pos=(w.DiarioScreeners?.holdings?.()||[]).find(x=>x.ticker===tk);return void abrir(tk,pos)}
   if(b.dataset.hf==='fechar'){e.preventDefault();fechar()}
   if(b.dataset.hf==='pdf'){e.preventDefault();w.print()}
  });
  w.document.addEventListener('keydown',e=>{if(e.key==='Escape'&&w.document.getElementById('hf847'))fechar()});
  /* Tela única: trocar de aba fecha a avaliação e cancela a carga pendente. */
  w.document.addEventListener('diario:render',()=>{try{if(typeof tab!=='undefined'&&tab!=='analises')fechar()}catch{}});
 }
 return {calcular,velocimetro,html,abrir,fechar};
});
