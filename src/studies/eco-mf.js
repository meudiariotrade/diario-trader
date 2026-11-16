/* v657 · Mundell–Fleming: simulação estilizada de equilíbrio IS–LM–BP. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state;
L.mf=p=>{
 const dy=4*(p.externo-p.selic),isShift=2*p.externo-p.selic;
 return {y:100+dy,i:p.externo,fx:isShift-.38*p.fiscal,isShift,lmShift:p.selic,bpShift:p.externo};
};
function curva(p){
 const x=y=>55+(y-88)/24*540, yy=i=>211-(i+4)/8*190;
 const linha=(fn,cor,traco)=>'<path d="M '+x(88).toFixed(1)+' '+yy(fn(88)).toFixed(1)+' L '+x(112).toFixed(1)+' '+yy(fn(112)).toFixed(1)+'" fill="none" stroke="'+cor+'" stroke-width="2.4"'+(traco?' stroke-dasharray="6 5"':'')+'/>';
 const is=(y,k)=>-.25*(y-100)+k,lm=(y,k)=>.25*(y-100)+k;
 return '<svg class="eco-plot" viewBox="0 0 650 264" role="img" aria-label="Diagrama IS-LM-BP: linhas tracejadas no cenário-base">'+
 '<rect x="55" y="20" width="540" height="191" fill="#151920" stroke="#1E232E"/>'+
 linha(y=>is(y,0),'#687181',true)+linha(y=>lm(y,0),'#687181',true)+linha(y=>0,'#687181',true)+
 linha(y=>is(y,p.isShift),'#D4A017',false)+linha(y=>lm(y,p.lmShift),'#10B981',false)+
 linha(y=>p.bpShift,'#6AA4D2',false)+
 '<circle cx="'+x(p.y).toFixed(2)+'" cy="'+yy(p.i).toFixed(2)+'" r="5" fill="#f5efde"/>'+
 '<text x="55" y="245" fill="#a5aebb" font-size="12">Produto (Y) · índice-base 100</text>'+
 '<text x="13" y="16" fill="#a5aebb" font-size="12">Δi</text>'+
 '<text x="350" y="16" fill="#D4A017" font-size="13">IS</text>'+
 '<text x="405" y="16" fill="#10B981" font-size="13">LM</text>'+
 '<text x="465" y="16" fill="#6AA4D2" font-size="13">BP</text></svg>';
}
L.views.mf=()=>{
 const p=L.mf(S);
 return '<div class="eco-grid-stats">'+L.kpi('Produto Y · base 100',L.f(p.y,1))+
 L.kpi('Juro interno · Δ',L.s(p.i,2)+' pp')+
 L.kpi('USD/BRL · Δ ilustrativo',L.s(p.fx,2)+'%')+'</div>'+
 L.card('Equilíbrio IS–LM–BP · câmbio flexível',curva(p)+
 L.note('Cores: IS (âmbar), LM (verde), BP (azul). Tracejado = cenário inicial; ponto branco = novo equilíbrio. Eixos normalizados, não são cotações de mercado.'))+
 L.card('Choques: ceteris paribus',
 L.slider('fiscal','G↑ / T↓ (impulso fiscal)',-3,3,.5,'')+
 L.slider('selic','Selic · choque contracionista (+)',-3,3,.5,' pp')+
 L.slider('externo','US10Y · choque externo',-2,2,.25,' pp'))+
 L.card('Interpretação guiada',L.note('<b>1. Política fiscal:</b> expansão desloca IS; sob alta mobilidade e câmbio flutuante a apreciação compensa parte da demanda externa, com efeito líquido pequeno sobre Y.')+
 L.note('<b>2. Política monetária:</b> aperto desloca LM para cima. A apreciação reduz exportações líquidas; Y tende a cair. Expansão monetária produz o oposto.')+
 L.note('<b>3. Juros externos:</b> BP sobe; pressiona câmbio e ajusta IS para restaurar equilíbrio externo.')+
 L.note('Os coeficientes foram escolhidos para <b>visualização pedagógica</b> do Mundell–Fleming com mobilidade de capitais e prêmio de risco constante. Não estimam PIB, curva DI ou preço futuro do dólar.'));
};
})();
