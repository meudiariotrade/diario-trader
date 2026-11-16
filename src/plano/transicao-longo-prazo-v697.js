/* v697 — Engenharia reversa do Plano de Transição; mantém 5 critérios e divisão 50/30/20. */
;(function(){
'use strict';
const w=window,d=document;
if(typeof vCarreira!=='function'||typeof crMeses!=='function'||typeof crCfg!=='function')return;
const key='carreiraEngenharia';
const state={cdi:null,busy:false,failedAt:0};
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,p=1)=>Number.isFinite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:p,maximumFractionDigits:p}):'—';
const brl=x=>Number.isFinite(x)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(x):'—';
const pct=x=>Number.isFinite(x)?fmt(x,1)+'%':'—';
const sum=a=>a.reduce((x,y)=>x+y,0);
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const num=(v,def=0)=>Number.isFinite(+v)?+v:def;
const addMonths=(base,n)=>new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+n,1,12));
const monthText=dt=>dt.toLocaleDateString('pt-BR',{month:'short',year:'numeric',timeZone:'UTC'}).replace('.','');
const dateKey=dt=>dt.toISOString().slice(0,7);
function cfg(){return (S.ax||{})[key]||{};}
const defaults=()=>({months:60,prazo:'60',sustainable:7,ipca:4,include13:false,includeVacation:false,benefits:0,health:0,
  manual:false,reserveManual:0,protocol:'',rehearsalStart:'',milestones:{}});
const get=()=>({...defaults(),...cfg()});
function saveCfg(patch){
 const old=get(),next={...old,...patch};
 if(typeof S.ax!=='object'||!S.ax)S.ax={};
 S.ax[key]=next;
 if(typeof save==='function')save();
 return next;
}
function reserveSource(){
 let ledger=null,portfolio=null,legacy=null;
 try{
  const raw=(S.fin||{}).res||[];
  if(raw.length)ledger=Math.max(0,sum(raw.map(x=>num(x.v))));
 }catch{}
 try{
  const pos=typeof w.pfCalc==='function'?w.pfCalc().pos||[]:[];
  const candidates=pos.filter(p=>['tesouro','rf','outro'].includes(p.cl)&&
   /SELIC|CAIXA|LIQUIDEZ|CDB[\s_-]*DI|^LFT\b|CDI\s*(?:100|110|120)/i.test(
    [p.tk,p.nome,(S.cart?.meta||{})[p.tk]?.nome].filter(Boolean).join(' ')));
  if(candidates.length)portfolio=Math.max(0,sum(candidates.map(p=>num(p.v))));
 }catch{}
 try{legacy=Number.isFinite(+crCfg().reserva)?Math.max(0,+crCfg().reserva):null;}catch{}
 // Contas distintas podem conter o mesmo dinheiro; não somar sem conciliação.
 if(ledger!==null)return {value:ledger,source:'Depósitos líquidos em Carteira / Reserva',verified:true,
  separate:portfolio!==null?portfolio:null};
 if(portfolio!==null)return {value:portfolio,source:'Posições Tesouro Selic / Caixa da Carteira',verified:true};
 return {value:legacy||0,source:'Valor informado anteriormente (sem vínculo de custódia)',verified:false};
}
function effectiveReserve(c,res){
 return c.manual?Math.max(0,num(c.reserveManual)):res.value;
}
function salarySplits(){
 const raw=(S.ax||{}).sal||{};
 return {salary:num(raw.saque,50),reinvest:clamp(num(raw.reinv,30),0,100),
  reserve:clamp(num(raw.res,20),0,100),repasse:clamp(num(raw.rep,80),0,100)};
}
function latestNet(){
 const e=crCfg(),ms=crMeses(e)||[];
 const closed=ms.filter(x=>!x.atual);
 const sample=closed.slice(-6);
 const mean=sample.length?sum(sample.map(x=>num(x.liq)))/sample.length:0;
 const table=ms;
 let mesa=0;
 try{
  // Repasse de mesas: mesma base e configuração usada em "Salário do trader".
  const by={};
  (S.mesaTr||[]).forEach(x=>{const k=String(x.dt).slice(0,7);by[k]=(by[k]||0)+num(x.v)});
  const split=salarySplits();
  for(const m of sample){const payout=by[m.k]||0;mesa+=payout>0?payout*split.repasse/100:payout;}
  mesa=sample.length?mesa/sample.length:0;
 }catch{}
 return {monthly:mean+mesa,monthlyTrades:mean,mesa,sample:sample.length,months:table};
}
function cdiCached(){
 if(state.cdi)return state.cdi;
 try{
  const v=JSON.parse(localStorage.getItem('diario-transicao-cdi-sgs4389')||'null');
  if(v&&num(v.rate,-1)>=0&&num(v.rate,100)<80&&/^\d{2}\/\d{2}\/\d{4}$/.test(v.date)){
   state.cdi=v;return v;
  }
 }catch{}
 return null;
}
async function fetchCDI(){
 if(state.busy||Date.now()-state.failedAt<3600000)return;
 const cache=cdiCached();
 if(cache&&Date.now()-num(cache.at)<12*3600000)return;
 state.busy=true;
 let error='';
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
  let response;
  try{response=await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json',{signal:controller.signal,cache:'no-store'});}
  finally{clearTimeout(timeout);}
  if(!response.ok)throw Error('SGS '+response.status);
  const rows=await response.json(),last=Array.isArray(rows)?rows.at(-1):null;
  const rate=Number(String(last?.valor||'').replace(',','.')),date=String(last?.data||'');
  if(!Number.isFinite(rate)||rate<0||rate>=80||!/^\d{2}\/\d{2}\/\d{4}$/.test(date))throw Error('resposta inválida');
  const next={rate,date,at:Date.now(),source:'BCB SGS 4389'};
  state.cdi=next;
  try{localStorage.setItem('diario-transicao-cdi-sgs4389',JSON.stringify(next));}catch{}
 }catch(e){error=String(e?.message||e);state.failedAt=Date.now();}
 finally{
  state.busy=false;
  if(typeof tab!=='undefined'&&tab==='carreira'&&typeof FIN!=='undefined'&&FIN.t==='plano'&&(!error||!cache)){
   try{render();}catch{}
  }
 }
}
function cdiAnnual(){
 const cache=cdiCached();
 if(cache){
  const age=Date.now()-num(cache.at);
  return {rate:cache.rate,source:age>72*3600000?'BCB SGS 4389 (dado antigo)':'BCB SGS 4389',date:cache.date,
    stale:age>72*3600000};
 }
 const jr=typeof cdiAno==='function'?cdiAno():null;
 return Number.isFinite(jr)&&jr>=0?{rate:jr,source:'CDI do painel Juros (cache)',date:'',stale:true}:
  {rate:null,source:'CDI indisponível; projeção sem juros',date:'',stale:true};
}
function targetMonths(c){
 const chosen=c.prazo==='custom'?num(c.months,60):num(c.prazo,60);
 return clamp(Math.round(chosen||60),1,360);
}
function capitalTarget(input){
 const {salary,cost,renda,health,benefits,extra13,extraVacation,monthlyRate,ipca,months}=input;
 const add13=extra13?salary/12:0,addVacation=extraVacation?salary/36:0;
 const living=Math.max(0,cost)+Math.max(0,health);
 const base=Math.max(Math.max(0,cost),Math.max(0,renda||salary));
 const income=base+Math.max(0,benefits)+Math.max(0,health)+(add13+addVacation);
 const reserve=12*living,capital=monthlyRate>0?income/(monthlyRate/100):null;
 const inflation=Math.pow(1+ipca/100,months/12);
 return {living,income,reserve,capital,total:capital!==null?reserve+capital:null,
  inflation,nominalReserve:reserve*inflation,nominalCapital:capital===null?null:capital*inflation,
  nominalTotal:capital===null?null:(reserve+capital)*inflation,extra13:add13,extraVacation:addVacation};
}
function runProjection(params,extra=0){
 const {reserve,bank,months,annualCDI,monthlyReinvest,monthlyReserve,monthlyCLT,goalReserve,goalBank}=params;
 const rate=Math.pow(1+Math.max(0,annualCDI)/100,1/12)-1;
 let R=reserve,B=bank;
 const path=[{month:0,reserve:R,bank:B}];
 for(let k=1;k<=months;k++){
  R*=1+rate;
  const saving=Math.max(0,monthlyReserve+monthlyCLT+extra);
  const toReserve=Math.min(saving,Math.max(0,goalReserve-R));
  R+=toReserve;
  B+=Math.max(0,monthlyReinvest)+saving-toReserve;
  path.push({month:k,reserve:R,bank:B});
 }
 return {path,reserve:R,bank:B,total:R+B,achieved:R+0.01>=goalReserve&&B+0.01>=goalBank};
}
function requiredExtra(params){
 if(!(params.goalReserve>=0&&params.goalBank>=0))return null;
 if(runProjection(params).achieved)return 0;
 let lo=0,hi=Math.max(100,params.goalReserve+params.goalBank);
 for(let i=0;i<44;i++){
  const mid=(lo+hi)/2;
  if(runProjection(params,mid).achieved)hi=mid;else lo=mid;
 }
 return Math.ceil(hi*100)/100;
}
function reverse(cfgRaw={},base={},reserveData={},net={},cdi=null,bankValue=null){
 const c={...defaults(),...cfgRaw},months=targetMonths(c);
 const salary=Math.max(0,num(base.renda)),cost=Math.max(0,num(base.custo));
 const renda=Math.max(0,num(base.alvo||base.renda||base.custo));
 const t=capitalTarget({salary,cost,renda,health:Math.max(0,num(c.health)),benefits:Math.max(0,num(c.benefits)),
  extra13:!!c.include13,extraVacation:!!c.includeVacation,monthlyRate:num(c.sustainable,7),ipca:num(c.ipca,4),months});
 const splits=salarySplits(),profit=Math.max(0,num(net.monthly)),clt=Math.max(0,salary-cost);
 const account=Math.max(0,bankValue===null?num(typeof capRef==='function'?capRef():0):bankValue);
 const startingReserve=effectiveReserve(c,reserveData);
 const model={reserve:startingReserve,bank:account,months,annualCDI:cdi?.rate??0,
  monthlyReserve:profit*splits.reserve/100,monthlyReinvest:profit*splits.reinvest/100,
  monthlyCLT:clt,goalReserve:t.nominalReserve,goalBank:t.nominalCapital};
 const valid=t.capital!==null&&t.nominalTotal>0&&cost>0;
 const path=valid?runProjection(model):null;
 const additional=valid?requiredExtra(model):null;
 const current=clt+model.monthlyReserve+model.monthlyReinvest;
 const necessary=additional===null?null:current+additional;
 const ratio=path&&t.nominalTotal?path.total/t.nominalTotal:null;
 const status=!valid?'Dados insuficientes':path.achieved?(ratio>=1.10?'Adiantado':'No ritmo'):'Atrasado';
 return {months,t,model,path,additional,current,necessary,status,ratio,splits,profit,salary,cost,renda,
  cdiKnown:cdi?.rate!==null&&cdi?.rate!==undefined};
}
function xmlChart(path,months,goal){
 if(!path||!path.length)return '';
 const width=660,height=214,left=52,right=645,top=10,bottom=183;
 const max=Math.max(1,...path.map(x=>x.bank+x.reserve),goal||0)*1.07;
 const x=i=>left+(right-left)*i/months,yy=n=>bottom-(bottom-top)*n/max;
 const stroke=(field,color)=>'<polyline fill="none" stroke="'+color+'" stroke-width="2" points="'+path.map(p=>x(p.month).toFixed(1)+','+yy(p[field]).toFixed(1)).join(' ')+'"/>';
 const total='<polyline fill="none" stroke="#D4A017" stroke-width="2.5" points="'+path.map(p=>x(p.month).toFixed(1)+','+yy(p.reserve+p.bank).toFixed(1)).join(' ')+'"/>';
 return '<svg viewBox="0 0 '+width+' '+height+'" class="trx-plot" role="img" aria-label="Projeção mensal da Reserva, Banca e Patrimônio até o alvo"><path d="M52 10V183H645" fill="none" stroke="#374151"/>'+
 '<path d="M52 '+yy(goal||0)+'H645" stroke="#A3AAB6" stroke-dasharray="5 5" fill="none"/>'+
 '<text x="3" y="19" font-size="10" fill="#A7B5C4">'+safe(fmt(max/1000,0))+' mil</text>'+
 stroke('reserve','#10B981')+stroke('bank','#769FC2')+total+
 '<text x="52" y="206" font-size="10" fill="#A7B5C4">Hoje</text><text x="601" y="206" font-size="10" fill="#A7B5C4">'+months+' meses</text></svg>'+
 '<div class="trx-legend"><span><i style="background:#10B981"></i>Reserva</span><span><i style="background:#769FC2"></i>Banca</span><span><i style="background:#D4A017"></i>Total</span><span><i style="background:#A3AAB6"></i>Meta</span></div>';
}
function benchmark(){
 const cfg=crCfg(),months=crMeses(cfg)||[],date=loc().slice(0,10),account=Math.max(0,num(typeof capRef==='function'?capRef():0));
 const cd=cdiAnnual(),cdRate=cd.rate;
 const year=date.slice(0,4)+'-01',twelve=dateKey(addMonths(new Date(Date.UTC(+date.slice(0,4),+date.slice(5,7)-1,1)), -11));
 let history=null;
 try{history=typeof perfCalc==='function'?perfCalc():null;}catch{}
 const ibov=(since)=>{
  if(!history||!Array.isArray(history.D)||!Array.isArray(history.ib))return null;
  const combined=history.D.map((v,i)=>({d:v,p:history.ib[i]})).filter(x=>Number.isFinite(+x.p)&&x.p>0&&x.d<=date);
  if(combined.length<2)return null;
  const prior=[...combined].reverse().find(x=>x.d<since)||combined.find(x=>x.d>=since);
  return prior&&combined.at(-1).d>prior.d?combined.at(-1).p/prior.p-1:null;
 };
 const entries=[['Este ano',year],['Últimos 12 meses',twelve]].map(([label,start])=>{
  const mo=months.filter(m=>m.k>=start&&m.k<=date.slice(0,7));
  const net=sum(mo.map(m=>num(m.liq))),irs=sum(mo.map(m=>num(m.ir)));
  const elapsed=mo.length||Math.max(1,Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(start+'-01T12:00:00Z'))/86400000/30.4));
  const cdi=cdRate===null?null:Math.pow(1+cdRate/100,elapsed/12)-1;
  return {label,net,irs,tradePct:account>0?net/account:null,cdiPct:cdi,ibPct:ibov(start)};
 });
 const line=(label,value)=>'<span>'+safe(label)+'</span><b class="'+(value<0?'r':value>0?'g':'')+'">'+(value===null?'—':pct(value*100))+'</b>';
 return '<h2>Seu trading × CDI × Ibovespa</h2><div class="card trx-benchmark">'+
 entries.map(v=>'<div class="trx-bmrow"><strong>'+safe(v.label)+'</strong><div class="trx-bmgrid">'+
 line('Trading líquido',v.tradePct)+line('CDI',v.cdiPct)+line('Ibovespa',v.ibPct)+
 '<span>Resultado em R$</span><b class="'+(v.net<0?'r':'g')+'">'+brl(v.net)+'</b>'+
 '<span>IR estimado incluído</span><b>'+brl(v.irs)+'</b></div></div>').join('')+
 '<p class="sm mut">Mesmo valor líquido de <b>Resultado por mês</b>: trades fechados, taxas e IR por categoria apurados em <code>crMeses()</code>. '+
 'CDI '+(cd.rate===null?'indisponível':pct(cd.rate)+' a.a.')+' · '+safe(cd.source)+(cd.date?' ('+safe(cd.date)+')':'')+
 '. Retornos comparados com o capital configurado'+(account?' ('+brl(account)+')':' (não informado)')+
 '. Ibovespa só aparece se houver histórico oficial do índice na Carteira; sem usar WIN como substituto.</p></div>';
}
function yearsList(result,c){
 const list=[];
 const base=new Date(Date.UTC(+loc().slice(0,4),+loc().slice(5,7)-1,1,12));
 const count=Math.ceil(result.months/12);
 for(let i=1;i<=count;i++){
  const m=Math.min(i*12,result.months),row=result.path?.path[m],
    p=i/count,marks=[];
  if(i===1)marks.push('Reserva de 6 meses');
  if(i===2||count===1)marks.push('Reserva de 12 meses');
  if(p>=0.33&&p<0.85)marks.push('Banca em crescimento rumo à meta');
  if(i===Math.max(2,count-1))marks.push('Formação / CNPI (conferir requisitos)');
  if(i===count)marks.push('Ensaio geral de 90 dias e decisão de saída');
  const label=marks.join(' · ')||'Revisão de ritmo, risco e aportes';
  list.push({i,month:m,label,date:monthText(addMonths(base,m)),reserve:row?.reserve,bank:row?.bank,
   done:!!c.milestones?.[i]});
 }
 return list;
}
function rehearsal(c,net,cost){
 if(!c.rehearsalStart)return '';
 const date=new Date(c.rehearsalStart+'T12:00:00Z');
 if(!Number.isFinite(+date))return '';
 const days=clamp(Math.floor((Date.now()-date.getTime())/86400000),0,90);
 const split=salarySplits();
 const salary=net.monthly>0?net.monthly*split.salary/100:0;
 return '<p class="trx-note">Ensaio iniciado: '+safe(c.rehearsalStart)+' · '+days+'/90 dias · salário médio do trader '+
 brl(salary)+'/mês · custo de vida '+brl(cost)+'/mês · cobertura '+(cost>0?pct(salary/cost*100):'—')+
 '. Registre gastos reais em Finanças; usar o saldo da reserva para sustentar o ensaio invalida o teste.</p>';
}
function view(){
 const c=get(),base=crCfg(),reserve=reserveSource(),net=latestNet(),cd=cdiAnnual(),months=targetMonths(c);
 const result=reverse(c,base,reserve,net,cd),t=result.t;
 const start=new Date(Date.UTC(+loc().slice(0,4),+loc().slice(5,7)-1,1,12)),end=addMonths(start,months);
 const sel=(a,b)=>a===b?' selected':'';
 const input=(k,label,v,min=0,max=1e9,step='any')=>
  '<label>'+safe(label)+'<input data-trx="'+k+'" type="number" step="'+step+'" min="'+min+'" max="'+max+'" inputmode="decimal" value="'+safe(v)+'"></label>';
 const line=(name,today,nominal)=>'<div class="trx-value"><span>'+safe(name)+'</span><b>'+brl(today)+'</b><b>'+brl(nominal)+'</b></div>';
 const tr=result,available=result.path?.total??null;
 const ratio=result.ratio;
 const records=yearsList(tr,c);
 const statusColor=tr.status==='Adiantado'?'g':tr.status==='No ritmo'?'g':tr.status==='Atrasado'?'r':'mut';
 const contingency=String(c.protocol||'');
 return '<section id="trx697" class="trx-root"><div class="trx-heading"><h2>Meta de saída da CLT · Engenharia reversa</h2><span class="trx-tag">'+safe(tr.status)+'</span></div>'+
 '<div class="trx-formgrid"><label>Prazo-alvo<select data-trx="prazo">'+
 [['36','3 anos'],['60','5 anos'],['72','6 anos'],['custom','Personalizado em meses']].map(([v,label])=>'<option value="'+v+'"'+sel(String(c.prazo),v)+'>'+label+'</option>').join('')+'</select></label>'+
 (c.prazo==='custom'?input('months','Número de meses',months,1,360,1):'')+
 input('sustainable','Rendimento sustentável simulado (% a.m.)',num(c.sustainable,7),.01,30,.1)+
 input('ipca','IPCA esperado no cenário (% a.a.)',num(c.ipca,4),-5,30,.1)+'</div>'+
 '<p class="trx-note">Data-alvo: <b>'+safe(monthText(end))+'</b> · '+months+' meses. Rendimento de 7% ao mês é <b>hipótese agressiva</b>, não garantia; revise com cenário conservador.</p>'+
 '<div class="trx-subheading">Proteção CLT e despesas de saída (opcionais)</div><div class="trx-formgrid">'+
 input('benefits','Benefícios CLT perdidos (R$/mês)',num(c.benefits),0,1e8,.01)+
 input('health','Plano de saúde particular (R$/mês)',num(c.health),0,1e8,.01)+
 '<label class="trx-check"><input type="checkbox" data-trx="include13"'+(c.include13?' checked':'')+'>Incluir 13º (1 salário / 12)</label>'+
 '<label class="trx-check"><input type="checkbox" data-trx="includeVacation"'+(c.includeVacation?' checked':'')+'>Incluir adicional de férias (1/3 / 12)</label></div>'+
 '<div class="trx-subheading">Patrimônio necessário até '+safe(monthText(end))+'</div>'+
 '<div class="trx-values"><div class="trx-value trx-vhead"><span>Objetivo</span><b>Reais de hoje</b><b>Nominal no alvo</b></div>'+
 line('Custo de vida mensal + saúde',t.living,t.living*t.inflation)+line('Reserva 12 meses',t.reserve,t.nominalReserve)+
 line('Renda alvo líquida CLT equivalente',t.income,t.income*t.inflation)+line('Banca operacional ideal',t.capital,t.nominalCapital)+
 '<div class="trx-value trx-total"><span>Reserva + banca</span><b>'+brl(t.total)+'</b><b>'+brl(t.nominalTotal)+'</b></div></div>'+
 '<p class="trx-note">Inflação: poder de compra de hoje convertido em valores nominais pelo IPCA assumido. Reserva preservada separadamente da banca. Meta de renda inclui custos extras optativos; equivalência não incorpora imposto futuro nem custos previdenciários não informados.</p>'+
 '<div class="trx-subheading">Reserva sincronizada com Carteira / Reserva</div>'+
 '<div class="trx-inline"><b>'+brl(effectiveReserve(c,reserve))+'</b><span>'+safe(c.manual?'Valor manual de cenário':reserve.source)+'</span></div>'+
 (reserve.separate!==undefined?'<p class="trx-note">Há também '+brl(reserve.separate)+' em posições Tesouro Selic/Caixa. Não somamos automaticamente para evitar contagem dupla.</p>':'')+
 '<label class="trx-check"><input type="checkbox" data-trx="manual"'+(c.manual?' checked':'')+'>Sobrescrever reserva para simular cenário</label>'+
 (c.manual?input('reserveManual','Reserva manual simulada (R$)',num(c.reserveManual),0,1e9,.01):'')+
 '<div class="trx-subheading">Ritmo mensal necessário × atual</div>'+
 '<div class="trx-metrics">'+
 '<div><small>Necessário por mês</small><b>'+brl(tr.necessary)+'</b></div>'+
 '<div><small>Ritmo atual estimado</small><b>'+brl(tr.current)+'</b></div>'+
 '<div><small>Diferença mensal</small><b class="'+statusColor+'">'+(tr.additional===null?'—':tr.additional===0?'Meta coberta':brl(tr.additional)+' faltantes')+'</b></div>'+
 '<div><small>Reserva + banca na data-alvo</small><b>'+brl(available)+'</b></div></div>'+
 '<p class="trx-note">Simulação de aportes: sobra CLT '+brl(result.model.monthlyCLT)+
 '/mês + '+fmt(tr.splits.reinvest,0)+'% reinvestidos '+brl(result.model.monthlyReinvest)+
 '/mês + '+fmt(tr.splits.reserve,0)+'% para reserva '+brl(result.model.monthlyReserve)+
 '/mês. Amostra: '+net.sample+' meses fechados, trading líquido médio '+brl(net.monthly)+
 '/mês; perdas não são projetadas como aportes positivos. CDI '+(cd.rate===null?'indisponível (0% no cenário)':pct(cd.rate)+' a.a. ('+safe(cd.source)+')')+
 '. CDI mantido constante só neste cenário, sem projetar decisões futuras do Copom. Aporte extra é valor adicional à projeção atual, não rendimento garantido. '+(reserve.verified?'Saldo da reserva conectado.':'Saldo de reserva sem confirmação por lançamentos.')+'</p>'+
 (result.path?xmlChart(result.path.path,months,t.nominalTotal):'<p class="trx-warning">Informe custo de vida, renda alvo e rentabilidade mensal maior que zero para calcular a meta.</p>')+
 '<div class="trx-subheading">Marcos anuais e ensaio geral</div>'+
 '<div class="trx-milestones">'+records.map(m=>'<label class="trx-milestone"><input type="checkbox" data-trx-done="'+m.i+'"'+(m.done?' checked':'')+'><span><b>Ano '+m.i+' · '+safe(m.date)+'</b><small>'+safe(m.label)+'</small><small>Reserva '+brl(m.reserve)+' · banca '+brl(m.bank)+'</small></span></label>').join('')+'</div>'+
 '<div class="trx-formgrid"><label>Modo ensaio geral: início dos 90 dias<input type="date" data-trx="rehearsalStart" value="'+safe(c.rehearsalStart||'')+'"></label></div>'+rehearsal(c,net,t.living)+
 '<label class="trx-protocol">Protocolo de Contingência Pós-CLT<textarea data-trx="protocol" rows="4" placeholder="Perda máxima mensal, meses sem saque, quando retornar à CLT, regras de reserva...">'+safe(contingency)+'</textarea></label>'+
 '<p class="trx-note">Marcos são orientativos e editáveis. Certificação/CNPI e ensaio não equivalem a aprovação ou habilitação profissional; decisão final exige reserva protegida, histórico líquido robusto e análise previdenciária.</p></section>';
}
const previous=vCarreira;
vCarreira=function(){
 if(typeof tab==='undefined'||tab!=='carreira'||typeof FIN==='undefined'||FIN.t!=='plano')
  return previous.apply(this,arguments);
 const config=get(),r=reserveSource(),chosen=effectiveReserve(config,r);
 // A leitura reflete os mesmos cinco critérios, sem gravar um saldo derivado no servidor.
 if(!S.ax)S.ax={};
 if(!S.ax.carreira)S.ax.carreira={};
 S.ax.carreira.reserva=chosen;
 const raw=previous.apply(this,arguments);
 if(typeof raw!=='string')return raw;
 const injected=view();
 let html=raw.replace('<h2>Critérios</h2>',injected+'<h2>Critérios</h2>');
 // O campo legado permanece visível mas passa a ser somente leitura; cenário no painel.
 html=html.replace(/<input([^>]*\bdata-cr="reserva"[^>]*)>/,(_,attrs)=>
  '<input'+attrs.replace('data-cr="reserva"','data-trx-readonly-reserve="1" readonly aria-label="Reserva vinculada ao painel de transição"')+'>');
 const a=html.indexOf('<h2>Seu trading × CDI × Ibovespa</h2>');
 const b=html.indexOf('<h2>Salário do trader</h2>',a+1);
 if(a>=0&&b>a)html=html.slice(0,a)+benchmark()+html.slice(b);
 if(!state.busy)queueMicrotask(()=>{if(typeof tab!=='undefined'&&tab==='carreira'&&FIN.t==='plano')fetchCDI();});
 return html;
};
d.addEventListener('change',e=>{
 const el=e.target?.closest?.('#trx697 [data-trx]');
 if(!el||typeof tab==='undefined'||tab!=='carreira'||typeof FIN==='undefined'||FIN.t!=='plano')return;
 const name=el.dataset.trx;
 const bounds={months:[1,360],sustainable:[.01,30],ipca:[-5,30],benefits:[0,1e8],health:[0,1e8],reserveManual:[0,1e9]};
 const patch={};
 if(['manual','include13','includeVacation'].includes(name))patch[name]=el.checked;
 else if(name==='prazo'&&['36','60','72','custom'].includes(el.value))patch[name]=el.value;
 else if(name==='protocol')patch[name]=String(el.value).slice(0,5000);
 else if(name==='rehearsalStart'&&(!el.value||/^\d{4}-\d{2}-\d{2}$/.test(el.value)))patch[name]=el.value;
 else if(bounds[name]){
  const n=Number(el.value),[a,b]=bounds[name];
  if(el.value.trim()!==''&&Number.isFinite(n)&&n>=a&&n<=b)patch[name]=name==='months'?Math.round(n):n;
 }
 if(!Object.keys(patch).length)return;
 saveCfg(patch);
 const scroll=window.scrollY;render();if(Math.abs(window.scrollY-scroll)>50)window.scrollTo(0,scroll);
},true);
d.addEventListener('change',e=>{
 const el=e.target?.closest?.('#trx697 [data-trx-done]');
 if(!el||typeof tab==='undefined'||tab!=='carreira'||FIN.t!=='plano')return;
 const n=+el.dataset.trxDone;
 if(n<1||n>30)return;
 const c=get(),milestones={...c.milestones,[n]:el.checked};
 saveCfg({milestones}); // Mantém a rolagem e não desmonta o controle.
},true);
d.addEventListener('input',e=>{
 const el=e.target?.closest?.('#trx697 textarea[data-trx="protocol"]');
 if(!el||typeof tab==='undefined'||tab!=='carreira'||FIN.t!=='plano')return;
 clearTimeout(state.protocolTimer);
 state.protocolTimer=setTimeout(()=>saveCfg({protocol:el.value.slice(0,5000)}),650);
},true);
const style=d.createElement('style');style.id='plano-transicao-v697-style';
style.textContent=[
'#trx697{margin:14px 0 16px;padding:12px 0;border-top:1px solid #1E232E;border-bottom:1px solid #1E232E;background:#11141B;font-variant-numeric:tabular-nums}',
'#trx697 .trx-heading{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:0 12px}',
'#trx697 .trx-heading h2{margin:0;color:#E2E6EC;font-size:15px}',
'#trx697 .trx-tag{color:#D4A017;font-size:12px;font-weight:700;white-space:nowrap}',
'#trx697 .trx-formgrid{padding:0 12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:12px 0}',
'#trx697 .trx-formgrid label,#trx697 .trx-protocol{font-size:11px;color:#ADBAC8;min-width:0;display:block}',
'#trx697 .trx-formgrid input:not([type=checkbox]),#trx697 .trx-formgrid select,#trx697 textarea{display:block;background:#181C26;color:#E8EDF3;border:1px solid #2D3848;border-radius:4px;padding:8px;width:100%;min-height:44px;font-size:16px;min-width:0;margin-top:5px;font-variant-numeric:tabular-nums}',
'#trx697 .trx-formgrid .trx-check,#trx697>.trx-check{display:flex;align-items:center;gap:8px;min-height:44px}',
'#trx697 .trx-check input{accent-color:#D4A017;width:18px;height:18px;flex:none}',
'#trx697>.trx-check,#trx697>.trx-inline{padding:0 12px}',
'#trx697 .trx-subheading{padding:12px 12px 6px;margin-top:12px;border-top:1px solid #1E232E;font-size:12px;font-weight:700;color:#D4A017}',
'#trx697 .trx-note{padding:0 12px;color:#9EACBB;font-size:11px;line-height:1.65;margin:9px 0}',
'#trx697 .trx-note b{color:#D5DEE8}',
'#trx697 .trx-values{margin:4px 12px 0}',
'#trx697 .trx-value{display:grid;grid-template-columns:minmax(120px,1.5fr) repeat(2,minmax(100px,1fr));gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #222A35;font-size:11px}',
'#trx697 .trx-value b{font-weight:600;white-space:nowrap;text-align:right;color:#E9EEF3}',
'#trx697 .trx-vhead{font-size:10px;color:#A5B4C5}',
'#trx697 .trx-vhead b{font-size:10px;color:#A5B4C5}',
'#trx697 .trx-total span,#trx697 .trx-total b{color:#D4A017;font-weight:800}',
'#trx697 .trx-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px}',
'#trx697 .trx-inline b{color:#10B981;font-size:18px}',
'#trx697 .trx-inline span{color:#A4B0BF}',
'#trx697 .trx-metrics{margin:8px 12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));border-top:1px solid #242C38}',
'#trx697 .trx-metrics div{padding:11px 8px;display:flex;flex-direction:column;gap:5px;border-bottom:1px solid #242C38;min-width:0}',
'#trx697 .trx-metrics small{font-size:10px;color:#A9B4C2}',
'#trx697 .trx-metrics b{font-size:15px;color:#F1F4F7;white-space:nowrap}',
'#trx697 .trx-metrics b.r{color:#EF4444}#trx697 .trx-metrics b.g{color:#10B981}',
'#trx697 .trx-plot{display:block;width:100%;height:auto;max-height:260px;margin:10px 0}',
'#trx697 .trx-legend{display:flex;flex-wrap:wrap;gap:12px;padding:0 12px;color:#9DACBC;font-size:10px}',
'#trx697 .trx-legend span{display:flex;align-items:center;gap:5px}',
'#trx697 .trx-legend i{display:inline-block;width:10px;height:3px}',
'#trx697 .trx-milestones{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:0;padding:0 12px}',
'#trx697 .trx-milestone{display:flex;gap:8px;min-width:0;padding:11px 4px;border-bottom:1px solid #262E3B;align-items:flex-start}',
'#trx697 .trx-milestone input{width:18px;height:18px;flex:none;accent-color:#D4A017}',
'#trx697 .trx-milestone span{display:flex;flex-direction:column;gap:4px;font-size:11px;min-width:0}',
'#trx697 .trx-milestone b{color:#D8E0E9}',
'#trx697 .trx-milestone small{font-size:10px;color:#9BA9B9}',
'#trx697 .trx-protocol{padding:8px 12px}',
'#trx697 .trx-benchmark .trx-bmrow{padding:8px 0;border-bottom:1px solid #28303B}',
'#trx697 .trx-bmgrid{display:grid;grid-template-columns:1fr auto;gap:6px;font-size:11px;margin-top:6px}',
'#trx697 .trx-bmgrid b{text-align:right;white-space:nowrap}',
'#trx697 .trx-warning{margin:9px 12px;padding:8px;border-left:2px solid #D4A017;color:#D4A017;font-size:11px}',
'.trx-benchmark{font-variant-numeric:tabular-nums;min-width:0}',
'.trx-benchmark .trx-bmrow{padding:9px 0;border-bottom:1px solid #1E232E}',
'.trx-benchmark .trx-bmgrid{display:grid;grid-template-columns:minmax(100px,1fr) auto;gap:6px;font-size:11px}',
'.trx-benchmark .trx-bmgrid b{white-space:nowrap;text-align:right}',
'@media(max-width:480px){#trx697 .trx-value{grid-template-columns:minmax(80px,1.45fr) repeat(2,minmax(74px,1fr));gap:4px;font-size:10px}#trx697 .trx-value b{font-size:10px}#trx697 .trx-formgrid{grid-template-columns:repeat(2,minmax(0,1fr))}#trx697 .trx-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}'
].join('\n');d.head.appendChild(style);
w.PlanoTransicao697=Object.freeze({capitalTarget,reverse,runProjection,requiredExtra,reserveSource,cdiAnnual,benchmark,yearsList,targetMonths,view});
})();
