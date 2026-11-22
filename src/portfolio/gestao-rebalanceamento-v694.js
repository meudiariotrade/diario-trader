/* v694 — Gestão & Rebalanceamento na aba Carteira, exclusivamente front-end. */
;(function(){
'use strict';
const W=window,D=document;
if(typeof vCarteiras!=='function'||typeof W.pfCalc!=='function')return;
const CLASS=[
 ['br','Ações Brasil'],['fii','FIIs'],['rf','Renda Fixa / Tesouro'],
 ['ext','Exterior / ETFs'],['crypto','Cripto'],['other','Outros / não classificados']
];
const state={open:false,mode:'class',contribution:1000,monthly:500,realRate:5,years:20,goal:1000,buyTk:'WEGE3',buyVal:2000,target:{class:{},asset:{}},identity:'',message:''};
const asNum=(x,fallback=null)=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(+x)?+x:fallback;
const sum=a=>a.reduce((acc,x)=>acc+x,0);
const money=n=>Number.isFinite(n)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n):'—';
const num=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const percent=n=>Number.isFinite(n)?num(n,1)+'%':'—';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const portfolio=()=>{try{return W.pfCalc();}catch{return {pos:[],v:0,fx:0};}};
const owned=()=>{try{return (S.cart||{});}catch{return {};}};
const storageId=()=>{
 let uid='local';
 try{uid=String(SESS?.uid||S.uid||'local').replace(/[^a-z0-9_-]/ig,'').slice(0,80)||'local';}catch{}
 return 'diario-gestao-rebalanceamento-v694:'+uid;
};
function restore(){
 const id=storageId();
 if(state.identity===id)return;
 state.identity=id;
 state.target={class:{},asset:{}};
 state.contribution=1000;state.goal=1000;state.monthly=500;state.realRate=5;state.years=20;state.mode='class';
 try{
  const v=JSON.parse(localStorage.getItem(id)||'null');
  if(v&&typeof v==='object'){
   if(v.target&&typeof v.target==='object'){
    for(const type of ['class','asset']){
     const input=v.target[type]||{};
     state.target[type]={};
     Object.entries(input).slice(0,500).forEach(([key,value])=>{
      const n=asNum(value);
      if(key.length<=100&&n!==null&&n>=0&&n<=100)state.target[type][key]=n;
     });
   }}
   for(const key of ['contribution','goal','monthly','realRate','years']){
    const n=asNum(v[key]);
    if(n!==null&&n>=0&&n<=100000000&&key!=='realRate'||key==='realRate'&&n!==null&&n>=-20&&n<=30)
     state[key]=n;
   }
   if(['class','asset'].includes(v.mode))state.mode=v.mode;
  }
 }catch{}
}
function persist(){
 try{localStorage.setItem(state.identity,JSON.stringify({
  target:state.target,mode:state.mode,contribution:state.contribution,goal:state.goal,
  monthly:state.monthly,realRate:state.realRate,years:state.years
 }));state.message='';}
 catch{state.message='Não foi possível salvar neste navegador.';}
}
const foreignETF=tk=>/^(IVVB11|SPXI11|NASD11|WRLD11|XINA11|EURP11|ACWI11|BIVB39|BOVA39|USTK11)$/i.test(tk);
function groupOf(p){
 if(p.cl==='cripto')return 'crypto';
 if(p.cl==='fii')return 'fii';
 if(p.cl==='tesouro'||p.cl==='rf')return 'rf';
 if(p.mk==='US'||['etf','etf_ext','bdr','acao_ext'].includes(p.cl)||foreignETF(p.tk))return 'ext';
 if(p.cl==='acao')return 'br';
 return 'other';
}
function holdings(snapshot){
 return (snapshot.pos||[]).filter(p=>Number.isFinite(+p.v)&&+p.v>=0&&+p.q>0)
  .map(p=>({...p,group:groupOf(p),key:String(p.mk||'BR')+':'+String(p.tk||''),v:+p.v,
    custo:Number.isFinite(+p.custo)?+p.custo:0,setor:String(p.setor||'Sem setor').trim()||'Sem setor'}));
}
function groups(snapshot,mode){
 const pos=holdings(snapshot),total=Math.max(0,+snapshot.v||0);
 if(mode==='asset')return pos.map(p=>({key:p.key,name:p.tk+' · '+p.mk,v:p.v,weight:total?p.v/total*100:0,position:p}));
 return CLASS.map(([key,name])=>({
  key,name,v:sum(pos.filter(p=>p.group===key).map(p=>p.v)),
  weight:total?sum(pos.filter(p=>p.group===key).map(p=>p.v))/total*100:0,
  count:pos.filter(p=>p.group===key).length
 }));
}
function initializedTargets(snapshot,mode){
 const arr=groups(snapshot,mode),existing=state.target[mode];
 if(!Object.keys(existing).length&&arr.length){
  if((+snapshot.v||0)>0){
   arr.forEach(o=>existing[o.key]=+o.weight.toFixed(5));
   // Ajuste decimal no último item para fechar 100% sem criar meta inventada.
   existing[arr.at(-1).key]=Math.max(0,100-sum(arr.slice(0,-1).map(o=>existing[o.key])));
  }else if(mode==='class'){
   CLASS.forEach(([key])=>existing[key]=key==='other'?0:20);
  }
 }
 return arr;
}
function allocation(groups,target,wealth,aporte){
 const contribution=Math.round(Math.max(0,aporte)*100)/100;
 const required=groups.map(p=>Math.max(0,(target[p.key]||0)/100*(wealth+contribution)-p.v));
 const sumNeed=sum(required);
 if(contribution<=0||!sumNeed)return {rows:groups.map((g,i)=>({...g,buy:0,newWeight:wealth?g.v/wealth*100:0})),unused:contribution};
 // Proporcional aos déficits, sem venda, com arredondamento determinístico em centavos.
 const ideal=required.map(x=>x/sumNeed*contribution*100),cents=ideal.map(x=>Math.floor(x+1e-9));
 let remaining=Math.round(contribution*100)-sum(cents);
 const order=ideal.map((x,i)=>({i,remainder:x-cents[i]})).sort((a,b)=>b.remainder-a.remainder);
 for(let i=0;i<remaining&&i<order.length;i++)cents[order[i].i]++;
 const buys=cents.map(x=>x/100);
 return {rows:groups.map((g,i)=>({...g,buy:buys[i],newWeight:(wealth+contribution)>0?(g.v+buys[i])/(wealth+contribution)*100:0})),unused:Math.max(0,contribution-sum(buys))};
}
function rebalance(snapshot){
 const arr=initializedTargets(snapshot,state.mode),targets=state.target[state.mode],total=sum(arr.map(p=>targets[p.key]??0));
 const amount=asNum(state.contribution);
 const valid=amount!==null&&amount>=0&&amount<=100000000&&arr.length&&Math.abs(total-100)<=0.06;
 return {arr,targets,total,amount,valid,simulation:valid?allocation(arr,targets,+snapshot.v||0,amount):null};
}
function yieldMetrics(snapshot){
 const pos=holdings(snapshot),meta=owned().meta||{};
 let annual=0,coveredMarket=0,coveredCost=0,n=0;
 const items=pos.map(p=>{
  const raw=asNum(meta[p.tk]?.fs?.dy),valid=raw!==null&&raw>=0&&raw<=100&&!['cripto','rf','tesouro'].includes(p.cl);
  const rate=valid?raw:null,ann=rate!==null?p.v*rate/100:null;
  if(valid){annual+=ann;coveredMarket+=p.v;coveredCost+=Math.max(0,p.custo);n++;}
  return {...p,dy:rate,annual:ann};
 });
 return {items,n,annual:n?annual:null,monthly:n?annual/12:null,
  dy:coveredMarket>0?annual/coveredMarket*100:null,
  yoc:coveredCost>0?annual/coveredCost*100:null,
  coverage:snapshot.v>0?coveredMarket/snapshot.v*100:0,
  sampleValue:coveredMarket,missing:items.filter(p=>p.dy===null).length};
}
function concentration(snapshot){
 const pos=holdings(snapshot),total=+snapshot.v||0;
 const sectors=new Map();
 pos.forEach(p=>sectors.set(p.setor,(sectors.get(p.setor)||0)+p.v));
 const topAssets=pos.filter(p=>total&&p.v/total>.20).sort((a,b)=>b.v-a.v);
 const topSectors=[...sectors.entries()].filter(([s,v])=>!/^(?:sem setor|etfs?|fundos imobiliários|renda fixa|cripto|outros)$/i.test(s)&&total&&v/total>.35).sort((a,b)=>b[1]-a[1]);
 const foreign=pos.filter(p=>p.group==='ext').reduce((s,p)=>s+p.v,0);
 const usd=pos.filter(p=>p.mk==='US').reduce((s,p)=>s+p.v,0);
 const crypto=pos.filter(p=>p.cl==='cripto').reduce((s,p)=>s+p.v,0);
 const unknown=pos.filter(p=>/^sem setor$/i.test(p.setor)).reduce((s,p)=>s+p.v,0);
 const missingFx=pos.some(p=>p.mk==='US')&&!(+snapshot.fx>0);
 return {topAssets,topSectors,foreign,usd,crypto,unknown,missingFx,
  foreignPct:total?foreign/total*100:null,usdPct:total?usd/total*100:null,
  sectors:[...sectors.entries()].sort((a,b)=>b[1]-a[1])};
}
function compound(initial,monthly,annualReal,years){
 if(![initial,monthly,annualReal,years].every(Number.isFinite)||initial<0||monthly<0||annualReal<=-100||years<1||years>60)return null;
 const r=Math.pow(1+annualReal/100,1/12)-1,months=Math.round(years*12);
 let wealth=initial,paid=initial;
 const points=[{year:0,wealth,paid}];
 for(let i=1;i<=months;i++){
  wealth=wealth*(1+r)+monthly;paid+=monthly;
  if(i%12===0||i===months)points.push({year:i/12,wealth,paid});
 }
 return {points,end:wealth,paid,withdrawal:wealth*0.04/12,realAnnual:annualReal,months};
}
function chart(items,field,title){
 if(items.length<2)return '';
 const arr=items.map(p=>p[field]),min=Math.min(0,...arr),max=Math.max(1,...arr);
 const coords=arr.map((v,i)=>[48+550*i/(arr.length-1),155-130*(v-min)/(max-min||1)]);
 const poly=coords.map(x=>x.map(v=>v.toFixed(1)).join(',')).join(' ');
 return '<svg role="img" aria-label="'+esc(title)+'" viewBox="0 0 620 189" class="rb694-svg"><path d="M48 22V155H598" fill="none" stroke="#566172"/>'+
 '<text x="5" y="28" fill="#9BA6B5" font-size="11">'+esc(num(max,0))+'</text><text x="5" y="155" fill="#9BA6B5" font-size="11">'+esc(num(min,0))+'</text>'+
 '<polyline points="'+poly+'" fill="none" stroke="#D4A017" stroke-width="2.3"/>'+
 '<text x="48" y="180" fill="#9BA6B5" font-size="11">0</text><text x="573" y="180" fill="#9BA6B5" font-size="11">'+esc(items.at(-1).year) +' anos</text></svg>';
}
function metric(label,value,foot=''){return '<div class="rb694-metric"><small>'+esc(label)+'</small><b>'+value+'</b>'+(foot?'<span>'+esc(foot)+'</span>':'')+'</div>';}
function field(key,label,value,step,min,max){
 return '<label>'+esc(label)+'<input data-rb694-field="'+esc(key)+'" type="number" inputmode="decimal" step="'+step+'" min="'+min+'" max="'+max+'" value="'+esc(value)+'"></label>';
}
function table(headers,rows){
 return '<div class="rb694-scroll"><table class="rb694-table"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+
 rows.join('')+'</tbody></table></div>';
}
function sectionOne(p){
 const r=rebalance(p),target=r.targets;
 const options=[['class','Por classe'],['asset','Por ativo']].map(([k,name])=>'<option value="'+k+'"'+(state.mode===k?' selected':'')+'>'+name+'</option>').join('');
 const form='<div class="rb694-controls"><label>Simulação de metas<select data-rb694-mode>'+options+'</select></label>'+
 field('contribution','Novo aporte (R$)',state.contribution,0.01,0,100000000)+'</div>';
 const tr=r.arr.map(row=>'<tr><th>'+esc(row.name)+'</th><td>'+percent(row.weight)+'</td><td><input class="rb694-target" data-rb694-target="'+esc(row.key)+'" type="number" inputmode="decimal" step="0.1" min="0" max="100" value="'+esc(num(target[row.key]??0,2).replace(/\./g,'').replace(',','.'))+'"></td>'+
 '<td>'+(r.simulation?money(r.simulation.rows.find(x=>x.key===row.key)?.buy):'—')+'</td></tr>');
 const byAsset=state.mode==='class'&&r.simulation?.rows.filter(x=>x.buy>0&&!(x.count>0)).map(x=>x.name).join(', ');
 return '<section class="rb694-section"><h3>01 · Novo aporte e rebalanceamento</h3>'+
 form+table(['Classe / ativo','Peso atual','Meta %','Comprar R$'],tr)+
 '<p class="rb694-note">Metas: <b>'+percent(r.total)+'</b> · valor atual '+money(p.v||0)+'. Metas devem somar 100% para simular.</p>'+
 (!r.valid?'<p class="rb694-notice">Ajuste as metas para 100% e informe um aporte válido.</p>':
 '<div class="rb694-stats">'+metric('Aporte distribuído',money(sum(r.simulation.rows.map(x=>x.buy))))+
 metric('Patrimônio após aporte',money((+p.v||0)+r.amount))+
 metric('Venda simulada',money(0),'Somente compras')+'</div>'+
 (byAsset?'<p class="rb694-notice">Aporte destinado a classe sem posição: '+esc(byAsset)+'. Escolha o ativo antes de investir; esta simulação não executa ordens.</p>':''))+
 '<p class="rb694-note">Aloca o aporte proporcionalmente aos déficits frente às metas, em centavos, sem vender posições. Não inclui corretagem, spread, IR nem arredondamento por lotes. Não representa recomendação.</p></section>';
}
function sectionTwo(p){
 const y=yieldMetrics(p),goal=state.goal,progress=goal>0&&y.monthly!==null?Math.min(100,y.monthly/goal*100):0;
 const lines=y.items.filter(x=>x.dy!==null).sort((a,b)=>b.annual-a.annual).slice(0,8).map(a=>
 '<tr><th>'+esc(a.tk)+'</th><td>'+percent(a.dy)+'</td><td>'+money(a.annual)+'</td></tr>');
 return '<section class="rb694-section"><h3>02 · Renda passiva e Yield on Cost</h3>'+
 '<div class="rb694-stats">'+metric('DY médio ponderado',percent(y.dy),'apenas ativos com DY informado')+
 metric('Yield on Cost',percent(y.yoc),'provento estimado / custo de compra')+
 metric('Renda mensal estimada',money(y.monthly))+
 metric('Renda anual estimada',money(y.annual))+'</div>'+
 '<div class="rb694-controls">'+field('goal','Meta inicial mensal (R$)',goal,.01,1,100000000)+'</div>'+
 '<div class="rb694-progress"><div class="rb694-progress-title"><span>Rumo à meta mensal</span><strong>'+percent(goal>0&&y.monthly!==null?y.monthly/goal*100:null)+'</strong></div>'+
 '<div class="rb694-track"><i style="width:'+progress.toFixed(2)+'%;background:'+(progress>=100?'#10B981':'#D4A017')+'"></i></div></div>'+
 (lines.length?table(['Ativo','DY anual','Proventos / ano'],lines):'<p class="rb694-notice">Faltam DYs válidos nos fundamentos já carregados. Não foi inventada uma estimativa de dividendos.</p>')+
 '<p class="rb694-note">Cobertura: '+percent(y.coverage)+' do patrimônio, '+y.n+' ativos com DY disponível; '+y.missing+' sem taxa válida. Previsão anual = valor de mercado × DY divulgado, mensal = anual ÷ 12. É uma média ilustrativa, não calendário de pagamento; FIIs e ações podem mudar distribuições e datas.</p></section>';
}
function sectionThree(p){
 const r=concentration(p);
 const alert=r.topAssets.length||r.topSectors.length;
 const lines=[...r.topAssets.map(x=>'<tr><th>Ativo · '+esc(x.tk)+'</th><td>'+percent(p.v>0?x.v/p.v*100:null)+'</td><td>Limite 20%</td></tr>'),
 ...r.topSectors.map(([sector,v])=>'<tr><th>Setor · '+esc(sector)+'</th><td>'+percent(p.v>0?v/p.v*100:null)+'</td><td>Limite 35%</td></tr>')];
 return '<section class="rb694-section"><h3>03 · Concentração e risco setorial</h3>'+
 '<div class="rb694-stats">'+metric('Exposição Exterior / ETFs',percent(r.foreignPct),'classificação por ativo')+
 metric('Posições em moeda USD',percent(r.usdPct),'sem look-through de ETFs')+
 metric('Valor fora do Brasil',money(r.foreign))+
 metric('Setor não classificado',money(r.unknown))+'</div>'+
 (alert?table(['Alerta','Peso atual','Referência'],lines):'<p class="rb694-note">Nenhum ativo acima de 20% ou setor identificado acima de 35% nesta carteira.</p>')+
 (r.missingFx?'<p class="rb694-notice">Dólar não cadastrado: ativos dos EUA podem ficar sem conversão correta. Atualize o câmbio da Carteira para análise confiável.</p>':'')+
 '<p class="rb694-note">Exterior inclui posições no mercado EUA, BDRs e ETFs classificados como internacionais. Cripto global: '+money(r.crypto)+'. A exposição cambial de fundos/ETFs brasileiros não pode ser determinada com precisão sem seus componentes; indicador aproximado, sem dupla contagem.</p></section>';
}
function sectionFour(p){
 const initial=Math.max(0,+p.v||0),r=compound(initial,+state.monthly,+state.realRate,+state.years);
 const fields='<div class="rb694-controls">'+field('monthly','Aporte mensal real (R$)',state.monthly,.01,0,10000000)+
 field('realRate','Taxa real anual (%)',state.realRate,.1,-20,30)+field('years','Prazo (anos)',state.years,1,1,60)+'</div>';
 return '<section class="rb694-section"><h3>04 · Independência financeira (valores reais)</h3>'+
 metric('Patrimônio atual',money(initial),'base: posições existentes')+fields+
 (r?'<div class="rb694-stats">'+metric('Patrimônio projetado',money(r.end),'em reais de hoje')+
 metric('Total aportado',money(r.paid),'patrimônio inicial + aportes')+
 metric('Renda pela regra 4%',money(r.withdrawal),'por mês, início da retirada')+'</div>'+
 chart(r.points,'wealth','Evolução do patrimônio real em poder de compra constante')+
 '<p class="rb694-note">Aporte constante em poder de compra, no final de cada mês; taxa real convertida para juros mensais compostos. Regra dos 4% = 4% do patrimônio projetado ao ano ÷ 12. Não é renda vitalícia garantida nem renda de dividendos; impostos, custos e variações não estão modelados.</p>':
 '<p class="rb694-notice">Ajuste o aporte, a taxa real e o prazo para valores válidos.</p>')+'</section>';
}
function sectionFive(p){
 const tk=String(state.buyTk||'').trim().toUpperCase(),val=Math.max(0,+state.buyVal||0);
 const pos=holdings(p),atual=Math.max(0,+p.v||0),novoTotal=atual+val;
 const ja=pos.find(x=>String(x.tk||'').toUpperCase()===tk);
 const valAtivo=(ja?Math.max(0,+ja.v||0):0)+val;
 const pesoAtivo=novoTotal>0?valAtivo/novoTotal*100:0;
 const av=tk&&W.DiarioAnalisesPlus?.avaliarAtivo?.(tk);
 const setor=ja?.setor||av?.setor||'Não classificado';
 const valSetor=pos.filter(x=>String(x.setor||'').toLowerCase()===String(setor).toLowerCase()).reduce((s,x)=>s+Math.max(0,+x.v||0),0)+(ja?0:val)+(ja?val:0);
 const pesoSetor=novoTotal>0?valSetor/novoTotal*100:0;
 const alertas=[];
 if(pesoAtivo>20)alertas.push('Markowitz: '+tk+' passaria a '+percent(pesoAtivo)+' da carteira (acima do limite saudável de 20%).');
 if(setor!=='Não classificado'&&pesoSetor>35)alertas.push('Markowitz: setor '+setor+' chegaria a '+percent(pesoSetor)+' (acima do limite de 35%).');
 const mungerHtml=av?
  '<div class="rb694-note" style="margin-top:8px"><b>M · Munger — Riscos antes de comprar '+esc(tk)+':</b><ul style="margin:4px 0 0;padding-left:16px">'+av.munger.riscos.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':
  '<p class="rb694-note">Dica: abra a aba <b>Análises</b> uma vez para carregar os alertas automáticos de Munger para '+esc(tk||'este ativo')+', ou clique abaixo para consultar a Áurea.</p>';
 return '<section class="rb694-section"><h3>05 · Simulador “E se eu comprar?” (Markowitz + Munger)</h3>'+
  '<div class="rb694-controls"><label>Ticker<input data-rb694-field="buyTk" value="'+esc(tk)+'" placeholder="WEGE3" maxlength="10" autocapitalize="characters"></label>'+
  field('buyVal','Valor da compra (R$)',val,.01,0,100000000)+'</div>'+
  (tk&&val>0?
   '<div class="rb694-stats">'+
   metric('Novo peso de '+tk,percent(pesoAtivo),ja?'já existe na carteira':'posição nova')+
   metric('Novo peso do setor',percent(pesoSetor),setor)+
   metric('Patrimônio simulado',money(novoTotal),'somente simulação')+'</div>'+
   (alertas.length?alertas.map(a=>'<p class="rb694-notice">'+esc(a)+'</p>').join(''):'<p class="rb694-note">Markowitz: compra dentro dos limites de diversificação (≤ 20% por ativo e ≤ 35% por setor).</p>')+
   mungerHtml+
   '<p style="margin-top:8px"><button type="button" class="pfbt" data-rb694-munger="'+esc(tk)+'|'+esc(val)+'|'+esc(percent(pesoAtivo))+'|'+esc(setor)+'">✦ Testar esta compra com @munger na Áurea</button></p>'
  :'<p class="rb694-note">Informe um ticker e o valor do aporte para simular o impacto antes de enviar a ordem.</p>')+
  '</section>';
}
function sectionSix(p){
 const pos=holdings(p),total=Math.max(0,+p.v||0);
 if(!total||!pos.length)return '';
 const sumCls=ks=>sum(pos.filter(x=>ks.includes(cls(x))).map(x=>Math.max(0,+x.v||0)));
 const vBR=sumCls(['br']),vFII=sumCls(['fii']),vEXT=sumCls(['ext']),vCRP=sumCls(['crypto']);
 const cenarios=[
  {nome:'Dólar +10%',delta:vEXT*0.10+vCRP*0.10,nota:'Valoriza exterior/ETFs e cripto em R$'},
  {nome:'B3 −15%',delta:-(vBR*0.15+vFII*0.08),nota:'Ações BR −15% · FIIs −8%'},
  {nome:'S&P 500 −10%',delta:-(vEXT*0.10+vCRP*0.12+vBR*0.04),nota:'Exterior −10% · cripto −12% · contágio B3 −4%'},
  {nome:'Crise local (B3 −15% + Dólar +10%)',delta:-(vBR*0.15+vFII*0.08)+(vEXT*0.10+vCRP*0.10),nota:'Testa se o exterior protege sua carteira'}
 ];
 const rows=cenarios.map(c=>{
  const pct=total>0?c.delta/total*100:0;
  const cor=c.delta>=0?'#10B981':'#F87171';
  return '<tr><th>'+esc(c.nome)+'<br><small style="color:#9FABBA;font-weight:400">'+esc(c.nota)+'</small></th><td style="color:'+cor+';font-weight:700">'+(c.delta>=0?'+':'')+money(c.delta)+'</td><td style="color:'+cor+';font-weight:700">'+(pct>=0?'+':'')+percent(pct)+'</td></tr>';
 });
 return '<section class="rb694-section"><details><summary style="padding:0;min-height:32px;font-size:13px">06 · Teste de estresse da carteira (Markowitz) <small>4 cenários</small></summary>'+
  table(['Cenário simulado','Impacto R$','Impacto %'],rows)+
  '<p class="rb694-note">Simulação linear aproximada pelas classes da sua carteira atual (sem correlação dinâmica ou opções). Uso educacional.</p></details></section>';
}
function body(){
 restore();
 const p=portfolio(),pos=holdings(p);
 return '<div class="rb694-body"><div class="rb694-overline">'+pos.length+' posição(ões) · carteira '+money(p.v||0)+' · parâmetros guardados somente neste navegador</div>'+
 (state.message?'<p class="rb694-notice">'+esc(state.message)+'</p>':'')+
 sectionOne(p)+sectionTwo(p)+sectionThree(p)+sectionFour(p)+sectionFive(p)+sectionSix(p)+'</div>';
}
function content(){
 return '<details id="rebalanceamento-carteira-v694" class="rb694"'+(state.open?' open':'')+'><summary>Gestão &amp; Rebalanceamento de Carteira <small>Aporte · Proventos · Concentração · Simulador</small></summary>'+
 (state.open?body():'')+'</details>';
}
const old=vCarteiras;
vCarteiras=function(){
 const existing=old.apply(this,arguments);
 if(typeof tab==='undefined'||tab!=='carteiras'||typeof existing!=='string')return existing;
 restore();
 const insert=content(),marker='<div class="pftabs"';
 const i=existing.indexOf(marker);
 if(i>=0)return existing.slice(0,i)+insert+existing.slice(i);
 const j=existing.lastIndexOf('</div>');
 return j>=0?existing.slice(0,j)+insert+existing.slice(j):existing+insert;
};
function refreshBody(){
 const root=D.getElementById('rebalanceamento-carteira-v694');
 if(root&&root.open){const oldBody=root.querySelector('.rb694-body');if(oldBody)oldBody.outerHTML=body();else root.insertAdjacentHTML('beforeend',body());}
}
function reconcile(el){
 if(el?.id!=='rebalanceamento-carteira-v694'||typeof tab==='undefined'||tab!=='carteiras'||!el.isConnected)return;
 state.open=el.open;
 const panel=el.querySelector('.rb694-body');
 if(el.open&&!panel)el.insertAdjacentHTML('beforeend',body());
 if(!el.open&&panel)panel.remove();
}
D.addEventListener('toggle',event=>reconcile(event.target),true);
// Captura a intenção antes de um repaint da tela que possa desmontar o <details>.
D.addEventListener('click',event=>{
 const summary=event.target.closest?.('#rebalanceamento-carteira-v694 summary');
 if(!summary||typeof tab==='undefined'||tab!=='carteiras')return;
 const root=summary.closest('#rebalanceamento-carteira-v694'),next=!root.open;
 state.open=next;
 queueMicrotask(()=>{
  if(!root.isConnected)return;
  if(root.open!==next)root.open=next;
  reconcile(root);
 });
},true);
D.addEventListener('click',event=>{
 const btn=event.target.closest?.('[data-rb694-munger]');
 if(!btn)return;
 const [tk,val,peso,setor]=(btn.getAttribute('data-rb694-munger')||'').split('|');
 const prompt='@munger Estou pensando em comprar '+tk+' (aporte de R$ '+val+', que ficaria com '+peso+' da minha carteira no setor '+setor+'). Aplique o Fear-Setting (Tim Ferriss): 1) Definir o pior cenário (impacto 1-10), 2) Prevenir, 3) Reparar se der errado, 4) Custo da inação e possíveis vieses de negação otimista.';
 W.TraderChat?.open?.();
 if(typeof ecoPergunta==='function')void ecoPergunta(prompt,{pergunta:prompt});
},true);
D.addEventListener('change',event=>{
 const el=event.target,root=el?.closest?.('#rebalanceamento-carteira-v694');
 if(!root||typeof tab==='undefined'||tab!=='carteiras')return;
 if(el.hasAttribute('data-rb694-mode')){
  state.mode=el.value==='asset'?'asset':'class';persist();refreshBody();return;
 }
 if(el.hasAttribute('data-rb694-target')){
  const k=el.getAttribute('data-rb694-target'),n=asNum(el.value);
  if(k.length<=100&&n!==null&&n>=0&&n<=100){state.target[state.mode][k]=n;persist();refreshBody();}
  return;
 }
 const k=el.getAttribute('data-rb694-field');
 if(k==='buyTk'){
  state.buyTk=String(el.value||'').trim().toUpperCase().slice(0,10);refreshBody();return;
 }
 if(k&&['contribution','monthly','realRate','years','goal','buyVal'].includes(k)){
  const n=asNum(el.value);
  if(n!==null&&n>= (k==='realRate'?-20:k==='years'||k==='goal'?1:0)&&n<=(k==='realRate'?30:k==='years'?60:100000000)){
   state[k]=n;persist();refreshBody();
  }
 }
},true);
const css=[
'#rebalanceamento-carteira-v694{display:block;background:#11141B;margin:14px 0;border-top:1px solid #1E232E;border-bottom:1px solid #1E232E;color:#E6E9ED;font-variant-numeric:tabular-nums}',
'#rebalanceamento-carteira-v694 summary{cursor:pointer;min-height:44px;padding:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;color:#D4A017;font-weight:700;font-size:13px}',
'#rebalanceamento-carteira-v694 summary small{font-size:11px;color:#AAB5C2;font-weight:400}',
'#rebalanceamento-carteira-v694 .rb694-body{padding:0 12px 14px}',
'#rebalanceamento-carteira-v694 .rb694-overline{font-size:11px;color:#A9B6C4;margin:8px 0 12px}',
'#rebalanceamento-carteira-v694 .rb694-section{border-top:1px solid #1E232E;margin-top:16px;padding-top:15px;min-width:0}',
'#rebalanceamento-carteira-v694 h3{font-size:13px;color:#E9EDF1;margin:0 0 10px}',
'#rebalanceamento-carteira-v694 .rb694-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0}',
'#rebalanceamento-carteira-v694 label{font-size:11px;color:#ABB7C5;min-width:0}',
'#rebalanceamento-carteira-v694 input,#rebalanceamento-carteira-v694 select{display:block;min-width:0;width:100%;font-size:16px;color:#EFF2F4;background:#181C26;border:1px solid #323B48;padding:8px;border-radius:4px;min-height:44px;font-variant-numeric:tabular-nums}',
'#rebalanceamento-carteira-v694 .rb694-target{max-width:105px;margin:0 0 0 auto;text-align:right}',
'#rebalanceamento-carteira-v694 .rb694-scroll{overflow-x:auto;max-width:100%;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}',
'#rebalanceamento-carteira-v694 .rb694-table{border-collapse:collapse;width:100%;min-width:520px;font-size:11px}',
'#rebalanceamento-carteira-v694 .rb694-table th,#rebalanceamento-carteira-v694 .rb694-table td{border-bottom:1px solid #29313D;padding:7px 8px;text-align:right;white-space:nowrap}',
'#rebalanceamento-carteira-v694 .rb694-table th:first-child{text-align:left}',
'#rebalanceamento-carteira-v694 .rb694-table thead th{font-weight:600;color:#9FABBA}',
'#rebalanceamento-carteira-v694 .rb694-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;border-top:1px solid #252C35;margin:10px 0}',
'#rebalanceamento-carteira-v694 .rb694-metric{padding:10px 8px;border-bottom:1px solid #252C35;display:flex;flex-direction:column;gap:5px;min-width:0}',
'#rebalanceamento-carteira-v694 .rb694-metric small,#rebalanceamento-carteira-v694 .rb694-metric span{font-size:10px;color:#9EACBC}',
'#rebalanceamento-carteira-v694 .rb694-metric b{font-size:16px;color:#F0F3F5;white-space:nowrap}',
'#rebalanceamento-carteira-v694 .rb694-note{margin:10px 0;font-size:11px;color:#AAB6C3;line-height:1.6}',
'#rebalanceamento-carteira-v694 .rb694-notice{font-size:11px;line-height:1.5;color:#D4A017;border-left:2px solid #D4A017;padding:7px 10px;background:#181C26}',
'#rebalanceamento-carteira-v694 .rb694-progress{margin:12px 0}',
'#rebalanceamento-carteira-v694 .rb694-progress-title{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#B9C2CF}',
'#rebalanceamento-carteira-v694 .rb694-track{height:8px;background:#29313D;margin-top:5px;overflow:hidden;border-radius:4px}',
'#rebalanceamento-carteira-v694 .rb694-track i{display:block;height:100%;border-radius:4px}',
'#rebalanceamento-carteira-v694 .rb694-svg{display:block;width:100%;height:auto;max-height:200px}',
'@media(max-width:480px){#rebalanceamento-carteira-v694 .rb694-body{padding:0 9px 12px}#rebalanceamento-carteira-v694 .rb694-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#rebalanceamento-carteira-v694 .rb694-metric b{font-size:14px}}'
].join('\n');
const style=D.createElement('style');style.id='rebalanceamento-carteira-style-v694';style.textContent=css;D.head.appendChild(style);
W.CarteiraGestao694=Object.freeze({groupOf,holdings,groups,allocation,rebalance,yieldMetrics,concentration,compound,content});
})();
