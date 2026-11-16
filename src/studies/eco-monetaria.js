/* v657 · Política monetária: Regra de Taylor, Fisher e vértices DI já presentes no Mercado. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,F=L.f,N=L.note,K=L.kpi;
function referencias(){
 let di=[],selic=null,ipca=null,data='';
 try{
  if(typeof M606!=='undefined'&&M606.v){
   data=M606.v.em||'';
   di=(M606.v.di||[]).filter(x=>x&&Number.isFinite(+x.taxa)&&+x.taxa>0).map(x=>({k:x.k||x.cod||'DI1',anos:+x.anos||0,taxa:+x.taxa})).sort((a,b)=>a.anos-b.anos);
  }
 }catch(_){}
 try{
  if(typeof JR!=='undefined'&&JR.data){
   if(JR.data.selic&&Number.isFinite(+JR.data.selic.v))selic=+JR.data.selic.v;
   if(JR.data.ipca12&&Number.isFinite(+JR.data.ipca12.v))ipca=+JR.data.ipca12.v;
   if(!di.length&&Array.isArray(JR.data.curva))di=JR.data.curva.filter(x=>x&&+x.taxa>0&&x.venc).map(x=>({k:x.cod||'DI',taxa:+x.taxa,anos:(Date.parse(x.venc)-Date.now())/(365.25*864e5)})).filter(x=>x.anos>0).sort((a,b)=>a.anos-b.anos);
  }
 }catch(_){}
 return {di,selic,ipca,data};
}
L.taylor=p=>p.neutro+p.infl+.5*(p.infl-p.meta)+.5*p.hiato;
L.fisher=(i,pi)=>((1+i/100)/(1+pi/100)-1)*100;
function grafico(di){
 if(di.length<2)return N('Não há pelo menos dois vértices DI carregados. Atualize a cotação na aba Mercado.');
 const min=Math.min(...di.map(x=>x.taxa))-.2,max=Math.max(...di.map(x=>x.taxa))+.2;
 const left=di[0].anos,right=di.at(-1).anos;
 const pts=di.map(d=>[46+(d.anos-left)/(right-left||1)*570,160-(d.taxa-min)/(max-min||1)*122]);
 return '<svg class="eco-plot" viewBox="0 0 668 194" role="img" aria-label="Curva DI: vértices observados por prazo">'+
 '<line x1="46" x2="625" y1="162" y2="162" stroke="#5d6775"/>'+
 '<polyline points="'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')+'" stroke="#D4A017" stroke-width="2.5" fill="none"/>'+
 pts.map((p,i)=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4" fill="#D4A017"><title>'+L.esc(di[i].k)+' · '+F(di[i].taxa)+'% a.a.</title></circle>').join('')+
 '<text x="46" y="186" fill="#a6afbe" font-size="12">Curto</text><text x="568" y="186" fill="#a6afbe" font-size="12">Longo</text></svg>';
}
L.views.mon=()=>{
 const d=referencias(),curta=d.di[0],longa=d.di.at(-1);
 const slope=curta&&longa?(longa.taxa-curta.taxa)*100:null;
 const referencia=curta?.taxa??d.selic;
 const nom=L.taylor(S),real=referencia!=null?L.fisher(referencia,S.infl):null;
 const leit=slope==null?'sem vértices suficientes':slope>15?'positivamente inclinada':slope< -15?'invertida':'aproximadamente plana';
 const carimbo=d.data?new Date(d.data).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'horário indisponível';
 return '<div class="eco-grid-stats">'+K('Taylor · taxa nominal indicada',F(nom)+'%')+K('Juro real ex-ante · Fisher',real==null?'Sem taxa nominal':F(real)+'%')+
 K('Inclinação longo − curto',slope==null?'Sem curva':L.s(slope,1)+' pb')+
 K('Taxa nominal de referência',referencia==null?'Não carregada':F(referencia)+'%')+'</div>'+
 L.card('ETTJ · curva de DI Brasil',grafico(d.di)+N('Leitura: curva <b>'+leit+'</b>. Vértices: '+d.di.length+'. Fonte: Mesa Macro já integrada. Consulta: '+L.esc(carimbo)+'. A inclinação também incorpora prêmios de prazo/risco, não apenas expectativas sobre Selic.'))+
 L.card('Simular a Regra de Taylor',
 L.slider('meta','Meta de inflação',2,6,.25,'%')+L.slider('infl','Inflação esperada',0,15,.25,'%')+
 L.slider('neutro','Juro real neutro',0,8,.25,'%')+L.slider('hiato','Hiato do produto',-8,8,.5,' pp')+
 N('i* = r* + πᵉ + 0,5(πᵉ − meta) + 0,5 hiato. É uma regra pedagógica com coeficientes fixos, não a função de reação efetiva do Copom.'))+
 L.card('Referências e conceitos',
 K('Selic no app',d.selic==null?'Não carregada':F(d.selic)+'%')+
 K('IPCA 12 meses observado',d.ipca==null?'Não carregado':F(d.ipca)+'%')+
 N('A inflação esperada é <b>informada no controle</b>. IPCA de 12 meses é passado, não expectativa ex-ante. Para projeção, consulte Focus ou fontes oficiais.')+
 '<button type="button" data-eco-btn="macro" class="eco-action">Atualizar dados já integrados</button>');
};
L.events.macro=async()=>{try{if(typeof m606Carrega==='function')await m606Carrega(true);}catch(_){}L.paint();};
L.events.enter=L.events.enter||{};L.events.enter.mon=()=>{try{if(typeof m606Carrega==='function')Promise.resolve(m606Carrega(false)).then(L.paint).catch(()=>{});}catch(_){}};
})();
