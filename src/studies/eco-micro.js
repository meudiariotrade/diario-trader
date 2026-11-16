/* v661 · Microeconomia visual em Estudos. Modelos normalizados, sem dados fictícios de mercado. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,F=L.f,N=L.note,C=L.card;
S.micro={tipo:'cons',R:120,px:6,py:4,alpha:.5,elastic:1.5,eta:.8,preco:10,renda:100,a:100,b:2,c:20,d:1,fixo:90,precoMercado:40,estrutura:'mon'};
const V=()=>S.micro,fmt=(x,n=2)=>F(Number.isFinite(x)?x:null,n);
const slider=(k,t,min,max,step,suf='')=>'<label class="eco-slider"><span>'+t+' <output data-uni-micro-out="'+k+'">'+fmt(V()[k],step<1?2:1)+suf+'</output></span><input type="range" data-uni-micro-range="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+V()[k]+'"></label>';
const point=(x,y)=>x.toFixed(1)+','+y.toFixed(1);
function graph(title,lines,dots,labels){
 const w=620,h=270;
 return '<svg class="eco-plot" viewBox="0 0 660 298" role="img" aria-label="'+L.esc(title)+'">'+
 '<rect x="45" y="12" width="'+w+'" height="'+h+'" fill="#11141B" stroke="#303746"/>'+
 [0,.25,.5,.75,1].map(t=>'<path d="M45 '+(12+h*t)+'H665" stroke="#222934" stroke-width="1"/>').join('')+
 lines.map(x=>'<polyline points="'+x.p.map(a=>point(...a)).join(' ')+'" fill="none" stroke="'+x.c+'" stroke-width="2.5"'+(x.d?' stroke-dasharray="5 4"':'')+'/>').join('')+
 dots.map(x=>'<circle cx="'+x[0]+'" cy="'+x[1]+'" r="5" fill="#f0e6ca" stroke="#D4A017" stroke-width="1"/>').join('')+
 '<text x="47" y="293" font-size="12" fill="#aeb8c8">'+L.esc(labels[0])+'</text>'+
 '<text x="48" y="23" font-size="12" fill="#aeb8c8">'+L.esc(labels[1])+'</text>'+
 lines.map((x,i)=>'<text x="'+(475+i*55)+'" y="293" fill="'+x.c+'" font-size="12">'+L.esc(x.n||'')+'</text>').join('')+'</svg>';
}
const scale=(x,lo,hi)=>45+(x-lo)/(hi-lo||1)*620;
const scaleY=(y,lo,hi)=>282-(y-lo)/(hi-lo||1)*270;
function cons(){
 const {R,px,py,alpha}=V(),maxx=R/px,maxy=R/py,x=alpha*R/px,y=(1-alpha)*R/py;
 const U=Math.pow(x,alpha)*Math.pow(y,1-alpha),mrs=alpha/(1-alpha)*y/x;
 const linha=[];for(let i=0;i<=40;i++){const x1=.05*maxx+(i/40)*.95*maxx,y1=Math.min(maxy*1.3,Math.pow(U/Math.pow(x1,alpha),1/(1-alpha)));linha.push([scale(x1,0,maxx),scaleY(y1,0,maxy*1.2)]);}
 const budget=[[scale(0,0,maxx),scaleY(maxy,0,maxy*1.2)],[scale(maxx,0,maxx),scaleY(0,0,maxy*1.2)]];
 return '<div class="eco-grid-stats">'+L.kpi('Bem X ótimo',fmt(x,2))+
 L.kpi('Bem Y ótimo',fmt(y,2))+L.kpi('Utilidade Cobb–Douglas',fmt(U,2))+L.kpi('TMS = Px/Py',fmt(mrs,2))+'</div>'+
 C('Restrição orçamentária & indiferença',graph('Restrição orçamentária e curva de indiferença',[
 {n:'Orç.',p:budget,c:'#D4A017'},{n:'U',p:linha,c:'#10B981'}],[[scale(x,0,maxx),scaleY(y,0,maxy*1.2)]],['Quantidade de X','Quantidade de Y'])+
 N('<b>1.</b> Restrição: Px·x + Py·y = R; interceptos R/Px = '+fmt(maxx)+' e R/Py = '+fmt(maxy)+'.')+
 N('<b>2.</b> Utilidade: U = x^α·y^(1−α); TMS = MUx/MUy = α·y / [(1−α)·x].')+
 N('<b>3.</b> Ótimo interior: TMS = Px/Py = '+fmt(px/py)+'. Logo x*=αR/Px e y*=(1−α)R/Py. Sem preferências não convexas, cantos ou racionamento.'));
}
function elast(){
 const {elastic:eps,eta,preco:P,renda:Y}=V();
 const q=(p,y)=>100*Math.pow(p/10,-eps)*Math.pow(y/100,eta);
 const Q=q(P,Y),dp=-eps*Q/P,dy=eta*Q/Y;
 const arr=[],arr2=[];
 for(let i=0;i<=42;i++){const x=2+i*(20/42);arr.push([scale(x,2,22),scaleY(q(x,Y),0,180)]);arr2.push([scale(x,2,22),scaleY(q(x,100),0,180)]);}
 return '<div class="eco-grid-stats">'+L.kpi('Quantidade demandada',fmt(Q))+
 L.kpi('Elasticidade-preço',fmt(-eps))+L.kpi('Elasticidade-renda',fmt(eta))+L.kpi('∂Q / ∂P',fmt(dp))+'</div>'+
 C('Demanda de elasticidade constante',graph('Curvas de demanda a rendas diferentes',[{n:'Y atual',p:arr,c:'#D4A017'},{n:'Y=100',p:arr2,c:'#10B981',d:true}],[[scale(P,2,22),scaleY(Q,0,180)]],['Preço (P)','Quantidade (Q)'])+
 N('<b>1.</b> Q(P,Y) = 100·(P/10)^(−ε)·(Y/100)^η = '+fmt(Q)+'.')+
 N('<b>2.</b> Elasticidade-preço ∂Q/∂P · P/Q = −ε = '+fmt(-eps)+'. Derivada ∂Q/∂P = −ε·Q/P = '+fmt(dp)+'.')+
 N('<b>3.</b> Elasticidade-renda ∂Q/∂Y · Y/Q = η = '+fmt(eta)+'. Derivada ∂Q/∂Y = η·Q/Y = '+fmt(dy)+'.')+
 N('<b>Interpretação:</b> |ε| '+(eps>1?'maior que 1: demanda elástica.':eps<1?'menor que 1: demanda inelástica.':'igual a 1: elasticidade unitária.')+' η '+(eta>0?'positiva (bem normal).':eta<0?'negativa (bem inferior).':'nula.') ));
}
function firma(){
 const {estrutura,a,b,c,d,fixo,precoMercado}=V();let q=0,P=0,qj=0,receita=0,custo=0,marginal=0;
 if(estrutura==='comp'){q=Math.max(0,(precoMercado-c)/d);P=precoMercado;marginal=P;}
 else if(estrutura==='mon'){q=Math.max(0,(a-c)/(2*b+d));P=Math.max(0,a-b*q);marginal=a-2*b*q;}
 else {q=Math.max(0,(a-c)/(3*b+d));qj=q;P=Math.max(0,a-b*(q+qj));marginal=a-b*(2*q+qj);}
 receita=P*q;custo=c*q+.5*d*q*q+fixo;
 const profit=receita-custo,maxQ=estrutura==='comp'?Math.max(q*1.8,30):Math.max(a/(b||1),1);
 const xpix=x=>scale(x,0,maxQ),ypix=y=>scaleY(y,0,a*1.15);
 const curves=[],add=(name,fn,color,dashed=false)=>{const line=[];for(let i=0;i<=70;i++){const x=maxQ*i/70;const y=fn(x);line.push([xpix(x),ypix(y)]);}curves.push({n:name,p:line,c:color,d:dashed});};
 if(estrutura==='comp')add('P',()=>precoMercado,'#D4A017');
 else{add('D',x=>a-b*(estrutura==='cour'?x+qj:x),'#D4A017');add('RMg',x=>a-b*(2*x+(estrutura==='cour'?qj:0)),'#6AA4D2');}
 add('CMg',x=>c+d*x,'#10B981');
 return '<div class="eco-grid-stats">'+L.kpi('Quantidade por firma',fmt(q))+
 L.kpi('Preço de equilíbrio',fmt(P))+L.kpi('RMg ou P no ótimo',fmt(marginal))+L.kpi('Lucro por firma',fmt(profit))+'</div>'+
 C('Firma · comparação de estruturas',graph('Oferta, receita marginal e custo marginal',curves,[[xpix(q),ypix(marginal)]],['Quantidade (q)','Preço / custo'])+
 N('<b>Demanda inversa de mercado:</b> P(Q) = a − b·Q; custo por firma C(q) = F + c·q + (d/2)·q². Logo CMg = c + d·q.')+
 (estrutura==='comp'?N('<b>Concorrência perfeita:</b> a firma toma P='+fmt(P)+' como dado. RMg(q)=P. Condição P = CMg = c+dq ⇒ q* = (P−c)/d = '+fmt(q)+'.'):
 estrutura==='mon'?N('<b>Monopólio:</b> RT(q) = (a−bq)q; ∂RT/∂q = a−2bq. RMg = CMg ⇒ q*=(a−c)/(2b+d) = '+fmt(q)+'. Segunda derivada do lucro = −2b−d < 0.'):
 N('<b>Cournot simétrico:</b> P=a−b(q₁+q₂). ∂π₁/∂q₁ = a−b(2q₁+q₂)−c−dq₁=0. Na simetria q₁=q₂=q*=(a−c)/(3b+d) = '+fmt(q)+'. Total Q='+fmt(2*q)+'.'))+
 N('<b>Lucro:</b> Π = RT − [F+cq+(d/2)q²] = '+fmt(profit)+'. Custos fixos não alteram o ótimo interior, mas afetam entrada/saída da firma. Modelo estático didático.'));
}
function controls(){
 const v=V();const top='<div class="eco-controls uni-micro-modes">'+[['cons','Consumidor'],['elas','Elasticidades'],['firma','Firma & mercados']].map(([id,label])=>'<button type="button" data-eco-btn="uniMicroMode" data-id="'+id+'" class="'+(v.tipo===id?'eco-action':'')+'">'+label+'</button>').join('')+'</div>';
 let c='';
 if(v.tipo==='cons')c=slider('R','Renda (R)',40,250,5,'')+slider('px','Preço do bem X',1,20,.5,'')+slider('py','Preço do bem Y',1,20,.5,'')+slider('alpha','Participação α do bem X',.1,.9,.05,'');
 else if(v.tipo==='elas')c=slider('preco','Preço P',2,22,.5,'')+slider('renda','Renda Y',50,180,5,'')+slider('elastic','Elasticidade-preço (módulo)',.2,3,.1,'')+slider('eta','Elasticidade-renda η',-1,2,.1,'');
 else c='<label>Estrutura de mercado<select data-uni-micro-estrutura>'+[['comp','Concorrência perfeita'],['mon','Monopólio'],['cour','Duopólio de Cournot']].map(([id,txt])=>'<option value="'+id+'"'+(v.estrutura===id?' selected':'')+'>'+txt+'</option>').join('')+'</select></label>'+
 slider('a','Intercepto demanda a',40,160,5,'')+slider('b','Inclinação demanda b',.5,5,.25,'')+
 slider('c','Custo marginal inicial c',5,50,5,'')+slider('d','Inclinação do custo marginal d',.5,3,.25,'')+
 slider('fixo','Custo fixo F',0,250,10,'')+(v.estrutura==='comp'?slider('precoMercado','Preço de mercado dado',10,110,5,''):'');
 return top+C('Parâmetros de '+({cons:'consumo',elas:'demanda',firma:'produção'}[v.tipo]),c);
}
function result(){return V().tipo==='cons'?cons():V().tipo==='elas'?elast():firma();}
L.views.micro=()=>C('Simulador de Microeconomia','<p class="eco-note">Altere os parâmetros para acompanhar o equilíbrio, os gráficos e a derivação matemática. Valores hipotéticos para fins acadêmicos.</p>')+
 '<div class="uni-micro-wrap"><div id="uni-micro-controls">'+controls()+'</div><div id="uni-micro-results">'+result()+'</div></div>';
L.events.uniMicroMode=el=>{V().tipo=el.dataset.id;L.paint();};
document.addEventListener('change',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='micro')return;
 if(e.target.matches('[data-uni-micro-estrutura]')){V().estrutura=e.target.value;L.paint();}
},true);
document.addEventListener('input',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='micro')return;
 const t=e.target;if(!t.matches('[data-uni-micro-range]'))return;
 const key=t.dataset.uniMicroRange;if(!(key in V()))return;
 V()[key]=+t.value;
 const out=document.querySelector('[data-uni-micro-out="'+key+'"]');
 if(out)out.textContent=fmt(V()[key],+t.step<1?2:1);
 const resultEl=document.getElementById('uni-micro-results');if(resultEl)resultEl.innerHTML=result();
},true);
L.microEconomia={consumo:()=>{const v=V();return {x:v.alpha*v.R/v.px,y:(1-v.alpha)*v.R/v.py};},firma:()=>{const v=V();return {mon:(v.a-v.c)/(2*v.b+v.d),cour:(v.a-v.c)/(3*v.b+v.d)};}};
})();
