/* v692 — Auditoria & Monte Carlo exclusivamente em Operações (sem novas APIs ou dados persistidos). */
;(function(){
'use strict';
const w=window,d=document;
const B={expanded:false,period:'all',module:'all',inputs:null,paramsKey:'',result:null};
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=x=>Number.isFinite(x)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(x):'—';
const nu=(x,n=2)=>Number.isFinite(x)?Number(x).toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n}):'—';
const pct=x=>Number.isFinite(x)?nu(x*100,1)+'%':'—';
const sum=arr=>arr.reduce((a,b)=>a+b,0);
const avg=arr=>arr.length?sum(arr)/arr.length:null;
const cut=(days)=>{
 const today=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const f=key=>+today.find(x=>x.type===key).value;
 return new Date(Date.UTC(f('year'),f('month')-1,f('day')-Number(days),12)).toISOString().slice(0,10);
};
function brazilStamp(raw){
 const text=String(raw||'').trim();
 if(!text)return null;
 const m=/^(\d{4}-\d\d-\d\d)[T ](\d\d):(\d\d)/.exec(text);
 if(!m)return null;
 // O diário e o Profit gravam hora local; timestamps com sufixo UTC/offset são convertidos.
 if(/(?:Z|[+-]\d\d:?\d\d)$/i.test(text)){
  const dt=new Date(text);if(!Number.isFinite(+dt))return null;
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(dt);
  const v=k=>p.find(x=>x.type===k)?.value;
  return {date:v('year')+'-'+v('month')+'-'+v('day'),minutes:+v('hour')*60+(+v('minute'))};
 }
 const min=+m[2]*60+(+m[3]);return min<1440?{date:m[1],minutes:min}:null;
}
function scope(rows,period=B.period,module=B.module){
 const from=period==='all'?'0000-00-00':cut(+period);
 return rows.filter(x=>(module==='all'||x.module===module)&&x.exitDate>=from);
}
function records(){
 // São as MESMAS operações carregadas no hub; reutiliza cálculo e câmbio existentes.
 const all=typeof modLinhas==='function'?modLinhas():S.trades.map(t=>({t,c:calc(t),m:''}));
 const normalized=[];
 for(const item of all){
  const t=item.t||{},c=item.c||{};
  if(t.lanc||c.pl==null||!Number.isFinite(+c.pl))continue; // excluir lançamentos e operações abertas
  let pl;
  try{pl=typeof emBRL==='function'?emBRL(+c.pl,moedaT(t)):+c.pl;}catch{pl=NaN;}
  if(!Number.isFinite(pl))continue; // jamais somar resultado em USD como se fosse BRL
  const stamp=String(t.dtx||t.dt||''),exitDate=stamp.slice(0,10);
  if(!/^\d{4}-\d\d-\d\d$/.test(exitDate))continue;
  normalized.push({id:String(t.id||t.ext||''),module:String(item.m||''),pl,exitDate,entry:brazilStamp(t.dt),setup:String(t.setup||'').trim(),rules:String(t.rules||''),error:String(t.err||''),raw:t});
 }
 return normalized.sort((a,b)=>a.exitDate.localeCompare(b.exitDate)||
  String(a.raw.dtx||a.raw.dt).localeCompare(String(b.raw.dtx||b.raw.dt))||
  a.id.localeCompare(b.id));
}
function summary(rows){
 const n=rows.length,wins=rows.filter(r=>r.pl>0),losses=rows.filter(r=>r.pl<0),winValues=wins.map(r=>r.pl),lossValues=losses.map(r=>-r.pl);
 const wp=n?wins.length/n:null,avgWin=avg(winValues),avgLoss=avg(lossValues);
 const grossPlus=sum(winValues),grossMinus=sum(lossValues);
 let running=0,peak=0,maxDD=0,streakWin=0,streakLoss=0,maxWin=0,maxLoss=0;
 const dd=[{n:0,v:0}];
 for(const r of rows){
  running+=r.pl;peak=Math.max(peak,running);const drop=Math.max(0,peak-running);
  maxDD=Math.max(maxDD,drop);dd.push({n:dd.length,v:-drop});
  if(r.pl>0){streakWin++;streakLoss=0;}
  else if(r.pl<0){streakLoss++;streakWin=0;}
  else{streakWin=streakLoss=0;}
  maxWin=Math.max(maxWin,streakWin);maxLoss=Math.max(maxLoss,streakLoss);
 }
 const ev=n?running/n:null;
 return {n,wins:wins.length,losses:losses.length,net:running,winRate:wp,avgWin,avgLoss,
  ev,payoff:avgWin!==null&&avgLoss>0?avgWin/avgLoss:null,
  pf:grossMinus>0?grossPlus/grossMinus:grossPlus>0?Infinity:null,
  dd,maxDD,maxWin,maxLoss};
}
function timeslot(minutes){
 if(!Number.isFinite(minutes))return null;
 if(minutes>=540&&minutes<600)return 0;
 if(minutes>=600&&minutes<690)return 1;
 if(minutes>=690&&minutes<840)return 2;
 if(minutes>=840&&minutes<1020)return 3;
 return null;
}
const SLOTS=['09h–10h · Abertura','10h–11h30 · NY','11h30–14h · Almoço','14h–17h · Tarde'];
const WEEK=['Segunda','Terça','Quarta','Quinta','Sexta'];
function weekday(date){
 if(!/^\d{4}-\d\d-\d\d$/.test(date))return null;
 const dt=new Date(date+'T12:00:00Z');if(!Number.isFinite(+dt))return null;
 const n=dt.getUTCDay();return n>=1&&n<=5?n-1:null;
}
function groups(rows){
 const hour=SLOTS.map((name,i)=>({name,list:rows.filter(x=>timeslot(x.entry?.minutes)===i)}));
 const week=WEEK.map((name,i)=>({name,list:rows.filter(x=>weekday(x.entry?.date||'')===i)}));
 const stats=hour.map(a=>({...a,stat:summary(a.list)}));
 const dependable=stats.filter(x=>x.stat.n>=3);
 const best=[...dependable].sort((a,b)=>b.stat.ev-a.stat.ev)[0]||null;
 const worst=[...dependable].sort((a,b)=>a.stat.ev-b.stat.ev)[0]||null;
 return {hour:stats,week:week.map(x=>({...x,stat:summary(x.list)})),best,worst,
  excluded:rows.length-hour.reduce((a,b)=>a+b.list.length,0)};
}
function discipline(row){
 const label=row.setup.toLocaleLowerCase('pt-BR');
 const invalid=!label||/^(?:sem setup|sem padr[aã]o|n[aã]o informado|indefinido|importado do profit|importado|sem estrat[eé]gia|impulsiv[oa]|fora do plano)$/i.test(label);
 const explicitOutside=row.rules.toLowerCase()==='n'||/dica\/emo[cç][aã]o|fora do sistema|impulsiv|fora do plano/i.test(row.error+' '+row.setup);
 if(explicitOutside)return 'outside';
 return invalid?'noSetup':'plan';
}
function disciplineSummary(rows){
 const plan=rows.filter(r=>discipline(r)==='plan');
 const noSetup=rows.filter(r=>discipline(r)==='noSetup');
 const outside=rows.filter(r=>discipline(r)==='outside');
 return {plan:summary(plan),noSetup:summary(noSetup),outside:summary(outside),
  other:summary(noSetup.concat(outside)),difference:plan.length&&noSetup.length+outside.length?summary(plan).ev-summary(noSetup.concat(outside)).ev:null};
}
function monteCarlo(options,count=500,horizon=100,rng=Math.random){
 const {winRate,avgWin,avgLoss,limit}=options;
 if(![winRate,avgWin,avgLoss,limit].every(Number.isFinite)||winRate<0||winRate>100||!(avgWin>0&&avgLoss>0&&limit>0))return null;
 const runs=[],all=Array.from({length:horizon+1},()=>[]);
 let hits=0;
 for(let k=0;k<count;k++){
  let equity=0,peak=0,hit=false;
  const points=[0];all[0].push(0);
  for(let j=1;j<=horizon;j++){
   equity+=rng()*100<winRate?avgWin:-avgLoss;
   peak=Math.max(peak,equity);
   if(peak-equity>=limit)hit=true;
   points.push(equity);all[j].push(equity);
  }
  if(hit)hits++;
  runs.push({points,final:equity,hit});
 }
 const med=all.map(values=>{values.sort((a,b)=>a-b);return (values[(count-1)>>1]+values[count>>1])/2;});
 runs.sort((a,b)=>a.final-b.final);
 return {count,horizon,hit:hits,risk:hits/count,median:med,worst:runs[0].points,best:runs.at(-1).points,
  worstFinal:runs[0].final,bestFinal:runs.at(-1).final,medianFinal:med.at(-1)};
}
function graph(lines,alt,labels){
 const arr=lines.flatMap(v=>v).filter(Number.isFinite);if(arr.length<2)return '';
 let mi=Math.min(...arr),ma=Math.max(...arr);if(mi===ma){mi-=1;ma+=1;}
 const n=Math.max(...lines.map(x=>x.length))-1||1;
 const colors=['#D4A017','#EF4444','#10B981'];
 const poly=lines.map((a,i)=>'<polyline points="'+a.map((v,j)=>(48+571*j/n).toFixed(1)+','+(168-134*(v-mi)/(ma-mi)).toFixed(1)).join(' ')+
   '" stroke="'+colors[i]+'" fill="none" stroke-width="'+(i===0?2.5:1.5)+'"/>').join('');
 return '<svg class="a691-svg" viewBox="0 0 646 203" role="img" aria-label="'+h(alt)+'"><path d="M48 24V168H620" fill="none" stroke="#596273"/>'+
 '<text x="4" y="27" font-size="11" fill="#A6B1C0">'+h(nu(ma,0))+'</text><text x="4" y="167" font-size="11" fill="#A6B1C0">'+h(nu(mi,0))+'</text>'+
 '<text x="48" y="191" font-size="11" fill="#A6B1C0">0</text><text x="591" y="191" font-size="11" fill="#A6B1C0">'+h(n)+'</text>'+
 poly+'</svg><div class="a691-legend">'+labels.map((x,i)=>'<span><i style="background:'+colors[i]+'"></i>'+h(x)+'</span>').join('')+'</div>';
}
function kpi(label,value,sub=''){
 return '<div class="a691-kpi"><small>'+h(label)+'</small><b>'+value+'</b>'+(sub?'<span>'+h(sub)+'</span>':'')+'</div>';
}
function rowTable(list,highlight){
 return '<div class="a691-scroll"><table class="a691-table"><thead><tr><th>Janela</th><th>Trades</th><th>Acerto</th><th>Líquido</th><th>EV / trade</th></tr></thead><tbody>'+
 list.map(r=>'<tr'+(highlight===r.name?' class="a691-mark"':'')+'><th>'+h(r.name)+'</th><td>'+r.stat.n+'</td><td>'+pct(r.stat.winRate)+'</td><td class="'+(r.stat.net<0?'a691-loss':'a691-profit')+'">'+brl(r.stat.net)+'</td><td>'+brl(r.stat.ev)+'</td></tr>').join('')+
 '</tbody></table></div>';
}
function drawSummary(s){
 return '<div class="a691-kpis">'+kpi('Expectativa / trade',brl(s.ev),'líquido médio')+
  kpi('Taxa de acerto',pct(s.winRate),s.wins+' ganhos · '+s.losses+' perdas')+
  kpi('Payoff médio',s.payoff==null?'—':nu(s.payoff,2)+'×','gain médio / loss médio')+
  kpi('Fator de lucro',s.pf===Infinity?'Sem perdas':s.pf==null?'—':nu(s.pf,2)+'×','gain bruto / loss bruto')+
  kpi('Drawdown máximo',brl(s.maxDD),'pico-a-vale no acumulado')+
  kpi('Sequências G / L',s.maxWin+' / '+s.maxLoss,'ganhos / perdas consecutivos')+'</div>'+
  graph([s.dd.map(x=>x.v)],'Drawdown acumulado pico-a-vale em reais, valores negativos',['Drawdown em R$'])+
  '<p class="a691-note">EV = (% acerto × ganho médio) − (% perda × perda média). Trades zerados entram na amostra com resultado 0. A curva parte de R$ 0 e mede quedas em relação ao maior lucro acumulado anterior.</p>';
}
function settings(rows,s){
 const key=B.period+'|'+B.module+'|'+rows.length+'|'+nu(s.net,2)+'|'+rows.at(-1)?.exitDate;
 if(key!==B.paramsKey){
  const prop=typeof S!=='undefined'?S.prop||{}:{};
  const limit=+prop.ddTotal>0?+prop.ddTotal:s.maxDD>0?s.maxDD:s.avgLoss>0?s.avgLoss*5:null;
  B.inputs={winRate:s.winRate==null?'':+(s.winRate*100).toFixed(1),avgWin:s.avgWin==null?'':+s.avgWin.toFixed(2),
   avgLoss:s.avgLoss==null?'':+s.avgLoss.toFixed(2),limit:limit==null?'':+limit.toFixed(2)};
  B.paramsKey=key;B.result=null;
 }
 return B.inputs;
}
function mcResults(){
 const r=B.result;if(!r)return '<p class="a691-note">Ajuste os parâmetros e execute 500 cenários de 100 trades. Nenhuma previsão será calculada sem inputs válidos.</p>';
 return '<div class="a691-kpis">'+kpi('Risco de atingir limite',pct(r.risk),'em qualquer ponto dos 100 trades')+
  kpi('Mediana final',brl(r.medianFinal),'resultado acumulado')+
  kpi('Pior cenário final',brl(r.worstFinal),'entre as 500 sequências')+
  kpi('Melhor cenário final',brl(r.bestFinal),'entre as 500 sequências')+'</div>'+
  graph([r.median,r.worst,r.best],'Monte Carlo 100 operações, cenário mediano, pior e melhor resultado final em R$',['Mediana','Pior cenário','Melhor cenário'])+
  '<p class="a691-note">Risco = '+r.hit+' de '+r.count+' trajetórias que atingiram o drawdown limite desde o pico. Simulação amostral de P&amp;L sem custos adicionais, mudança de lote ou dependência temporal; <b>não é probabilidade de falência da conta</b>.</p>';
}
function montePanel(s,rows){
 const p=settings(rows,s);
 const field=(key,name,step,min,max)=>'<label>'+h(name)+'<input type="number" inputmode="decimal" step="'+step+'" min="'+min+'" max="'+max+'" data-a691-set="'+key+'" value="'+h(p[key])+'"></label>';
 const isValid=s.n>=2&&s.wins>0&&s.losses>0;
 return '<div class="a691-fields">'+field('winRate','Acerto %',0.1,0,100)+field('avgWin','Gain médio R$',0.01,0.01,10000000)+
  field('avgLoss','Loss médio R$ (magnitude)',0.01,0.01,10000000)+field('limit','Limite de drawdown R$',0.01,0.01,100000000)+'</div>'+
 '<div class="a691-actions"><button type="button" data-a691-run>Simular 500 × 100 trades</button>'+
 '<button type="button" data-a691-reset>Restaurar médias dos trades</button></div>'+
 (!isValid?'<p class="a691-note">Amostra sem ganhos e perdas suficientes: informe manualmente valores válidos, sem números fictícios automáticos.</p>':'')+
 '<div id="a691-monte-results" aria-live="polite">'+mcResults()+'</div>';
}
function disciplinePanel(rows){
 const dis=disciplineSummary(rows),display=(title,s)=>'<div class="a691-discipline"><span>'+h(title)+'</span><b>'+s.n+' trades</b><b>'+pct(s.winRate)+'</b><b class="'+(s.net<0?'a691-loss':'a691-profit')+'">'+brl(s.net)+'</b></div>';
 return '<div class="a691-discipline a691-dhead"><span>Classificação</span><b>Amostra</b><b>Acerto</b><b>Resultado</b></div>'+
 display('Setup válido registrado',dis.plan)+display('Sem setup informado',dis.noSetup)+display('Fora do plano / impulsivo',dis.outside)+
 '<div class="a691-difference">Diferença de EV/trade (com setup − sem setup/fora do plano): <b>'+brl(dis.difference)+'</b></div>'+
 '<p class="a691-note">“Importado do Profit” não comprova setup: entra em “sem setup informado”. Fora do plano exige marcação em regras/erro. Associação histórica, não prova causal de disciplina no resultado.</p>';
}
function mainPanel(){
 const rows=scope(records()),s=summary(rows),g=groups(rows);
 return '<div class="a691-panel"><div class="a691-head"><b>BASE ANALISADA</b><span>'+s.n+' operações encerradas · resultado '+brl(s.net)+'</span></div>'+
 '<div class="a691-fields a691-filters"><label>Período<select data-a691-filter="period">'+[['all','Todas'],['30','Últimos 30 dias'],['90','Últimos 90 dias'],['180','Últimos 180 dias']].map(([k,v])=>'<option value="'+k+'"'+(B.period===k?' selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
 '<label>Modalidade<select data-a691-filter="module">'+[['all','Todas'],['dt','Day trade'],['sw','Swing trade'],['op','Opções'],['fx','Forex'],['us','Mercado americano'],['ex','Exterior']].map(([k,v])=>'<option value="'+k+'"'+(B.module===k?' selected':'')+'>'+v+'</option>').join('')+'</select></label></div>'+
 (s.n?'<section class="a691-section"><h3>01 · Raio-X de horário e semana</h3>'+
 '<p class="a691-note">Hora de entrada em Brasília. Janelas exclusivas (09h–17h). Melhor/pior = maior/menor EV por trade, com mínimo de 3 operações na faixa.</p>'+
 rowTable(g.hour,g.best?.name)+
 '<div class="a691-signals">'+(g.best?'<div><small>Melhor janela</small><b class="a691-profit">'+h(g.best.name)+'</b></div>':'')+
 (g.worst&&g.worst!==g.best?'<div><small>Maior risco histórico</small><b class="a691-loss">'+h(g.worst.name)+'</b></div>':'')+'</div>'+
 (g.excluded?'<p class="a691-note">'+g.excluded+' operações sem horário de entrada 09h–17h foram excluídas apenas da tabela de horários.</p>':'')+
 '<h4>Por dia da semana</h4>'+rowTable(g.week)+'</section>'+
 '<section class="a691-section"><h3>02 · EV, payoff & drawdown</h3>'+drawSummary(s)+'</section>'+
 '<section class="a691-section"><h3>03 · Monte Carlo | 100 trades</h3>'+montePanel(s,rows)+'</section>'+
 '<section class="a691-section"><h3>04 · Disciplina e setups</h3>'+disciplinePanel(rows)+'</section>':
 '<p class="a691-note">Nenhuma operação encerrada com P&amp;L válido neste recorte. Ajuste os filtros ou sincronize seus trades do Profit; nenhum resultado é inventado.</p>')+
 '<p class="a691-foot">Cálculos locais sobre operações já carregadas; não altera trades, integração Profit nem banco. P&amp;L convertido para R$ pela taxa já usada no aplicativo. Apenas resultados encerrados, sem lançamentos financeiros.</p></div>';
}
function auditMarkup(){
 return '<details class="a691-root" id="ops-audit-691"'+(B.expanded?' open':'')+
  '><summary>Auditoria &amp; Monte Carlo <small>Horários · EV · Risco · Disciplina</small></summary>'+
  (B.expanded?mainPanel():'')+'</details>';
}
// A rota Operações pode ser reconstruída por uma camada posterior.
// Encaixa a auditoria no DOM final, sem manter qualquer outra aba montada.
function mount(){
 if(typeof tab==='undefined'||tab!=='ops')return;
 const app=d.getElementById('app');
 if(!app||app.querySelector('#ops-audit-691'))return;
 const anchor=app.querySelector('.modg')||app.querySelector('h1');
 const host=d.createElement('div');
 host.innerHTML=auditMarkup();
 const element=host.firstElementChild;
 if(anchor)anchor.after(element);
 else app.prepend(element);
}
if(typeof vOpsHub==='function'){
 const original=vOpsHub;
 vOpsHub=function(){
  const base=original.apply(this,arguments),audit=auditMarkup();
  return base.includes('<h2>Visão geral</h2>')?
   base.replace('<h2>Visão geral</h2>',audit+'<h2>Visão geral</h2>'):base+audit;
 };
}
function watchApp(){
 const app=d.getElementById('app');
 if(!app)return;
 if(!app._opsAuditObserver){
  const observer=new MutationObserver(mount);
  observer.observe(app,{childList:true});
  app._opsAuditObserver=observer;
 }
 mount();
}
if(w.TraderUI?.onRender)w.TraderUI.onRender('ops-audit-691',mount);
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',watchApp,{once:true});
else watchApp();
d.addEventListener('toggle',e=>{
 if(e.target?.id!=='ops-audit-691'||typeof tab==='undefined'||tab!=='ops')return;
 const open=e.target.open;
 if(open===B.expanded)return;
 B.expanded=open;
 if(open){
  // Reaproveita a seção existente, sem criar sobreposição nem remount da tela inteira.
  e.target.insertAdjacentHTML('beforeend',mainPanel());
 }else{
  const panel=e.target.querySelector('.a691-panel');if(panel)panel.remove();
 }
},true);
d.addEventListener('change',e=>{
 if(typeof tab==='undefined'||tab!=='ops'||!e.target.closest?.('#ops-audit-691'))return;
 if(e.target.hasAttribute('data-a691-filter')){
  const key=e.target.getAttribute('data-a691-filter'),value=e.target.value;
  if(key==='period'&&['all','30','90','180'].includes(value))B.period=value;
  if(key==='module'&&['all','dt','sw','op','fx','us','ex'].includes(value))B.module=value;
  B.paramsKey='';B.result=null;render();return;
 }
 if(e.target.hasAttribute('data-a691-set')){
  const key=e.target.getAttribute('data-a691-set');
  if(Object.prototype.hasOwnProperty.call(B.inputs||{},key)){B.inputs[key]=e.target.value;B.result=null;const out=d.getElementById('a691-monte-results');if(out)out.innerHTML=mcResults();}
 }
},true);
d.addEventListener('click',e=>{
 if(typeof tab==='undefined'||tab!=='ops'||!e.target.closest?.('#ops-audit-691'))return;
 if(e.target.closest('[data-a691-reset]')){
  B.paramsKey='';B.result=null;
  const panel=d.querySelector('#ops-audit-691 .a691-panel');
  if(panel)panel.outerHTML=mainPanel();
  return;
 }
 if(!e.target.closest('[data-a691-run]'))return;
 const panel=d.getElementById('ops-audit-691');if(!panel)return;
 for(const el of panel.querySelectorAll('[data-a691-set]')){
  const key=el.dataset.a691Set;B.inputs[key]=el.value;
 }
 const toNum=x=>String(x??'').trim()===''?NaN:Number(x);
 B.result=monteCarlo(Object.fromEntries(['winRate','avgWin','avgLoss','limit'].map(k=>[k,toNum(B.inputs[k])])));
 const target=d.getElementById('a691-monte-results');
 if(target)target.innerHTML=B.result?mcResults():'<p class="a691-note a691-loss">Preencha acerto entre 0 e 100%, médias de gain/loss positivas e limite de drawdown maior que zero.</p>';
},true);
const styles=[
'#ops-audit-691{background:#11141B;border-top:1px solid #1E232E;border-bottom:1px solid #1E232E;margin:14px 0;color:#E3E8EF;font-variant-numeric:tabular-nums}',
'#ops-audit-691 summary{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:7px;min-height:44px;padding:12px 14px;cursor:pointer;color:#D4A017;font-weight:750;font-size:14px;list-style-position:inside}',
'#ops-audit-691 summary small{color:#9CA9B9;font-size:11px;font-weight:400}',
'#ops-audit-691 .a691-panel{padding:4px 14px 14px;min-width:0}',
'#ops-audit-691 .a691-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;border-bottom:1px solid #1E232E;padding:10px 0;font-size:12px}',
'#ops-audit-691 .a691-head b{color:#D4A017}#ops-audit-691 .a691-head span{color:#B6C0CC}',
'#ops-audit-691 .a691-section{border-top:1px solid #1E232E;padding-top:13px;margin-top:18px;min-width:0}',
'#ops-audit-691 h3{font-size:14px;color:#F0F3F6;margin:0 0 8px}#ops-audit-691 h4{font-size:12px;color:#BBC6D2;margin:13px 0 6px}',
'#ops-audit-691 .a691-note,#ops-audit-691 .a691-foot{font-size:11px;line-height:1.6;color:#A8B4C2;margin:10px 0}',
'#ops-audit-691 .a691-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:12px 0}',
'#ops-audit-691 .a691-fields label{font-size:11px;color:#ABB6C5;min-width:0}',
'#ops-audit-691 .a691-fields input,#ops-audit-691 .a691-fields select{display:block;width:100%;min-width:0;margin-top:5px;min-height:44px;background:#181C26;color:#F0F2F5;border:1px solid #313947;border-radius:4px;padding:8px;font-size:16px;font-variant-numeric:tabular-nums}',
'#ops-audit-691 .a691-scroll{overflow-x:auto;max-width:100%;overscroll-behavior-x:contain}',
'#ops-audit-691 .a691-table{border-collapse:collapse;min-width:575px;width:100%;font-size:11px}',
'#ops-audit-691 .a691-table th,#ops-audit-691 .a691-table td{padding:9px 8px;border-bottom:1px solid #252D38;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}',
'#ops-audit-691 .a691-table th:first-child{text-align:left}',
'#ops-audit-691 .a691-table thead th{font-weight:600;color:#99AABC}',
'#ops-audit-691 .a691-table .a691-mark{background:#181C26}#ops-audit-691 .a691-table .a691-mark th{color:#D4A017}',
'#ops-audit-691 .a691-profit{color:#10B981!important}#ops-audit-691 .a691-loss{color:#EF4444!important}',
'#ops-audit-691 .a691-signals{display:flex;flex-wrap:wrap;gap:16px;margin:10px 0}',
'#ops-audit-691 .a691-signals div{display:flex;flex-direction:column;gap:4px;min-width:0;font-size:12px}#ops-audit-691 .a691-signals small{color:#9FAEBE}',
'#ops-audit-691 .a691-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));border-top:1px solid #252D38;margin:11px 0}',
'#ops-audit-691 .a691-kpi{display:flex;flex-direction:column;min-width:0;padding:12px 9px;gap:5px;border-bottom:1px solid #252D38}',
'#ops-audit-691 .a691-kpi small,#ops-audit-691 .a691-kpi span{font-size:10px;color:#A1ADBC}',
'#ops-audit-691 .a691-kpi b{font-size:17px;color:#F0F2F5;white-space:nowrap}',
'#ops-audit-691 .a691-svg{max-width:100%;width:100%;height:auto;max-height:230px;display:block;margin:12px 0}',
'#ops-audit-691 .a691-legend{display:flex;flex-wrap:wrap;gap:12px;font-size:10px;color:#A6B3C2}',
'#ops-audit-691 .a691-legend span{display:flex;align-items:center;gap:5px}#ops-audit-691 .a691-legend i{width:9px;height:9px;display:inline-block}',
'#ops-audit-691 .a691-actions{display:flex;flex-wrap:wrap;gap:10px}',
'#ops-audit-691 .a691-actions button{min-height:44px;background:#181C26;border:1px solid #343B47;border-radius:4px;color:#E1E6ED;padding:9px 11px;font-size:12px;cursor:pointer}',
'#ops-audit-691 .a691-actions button:first-child{color:#D4A017;border-color:#58451E}',
'#ops-audit-691 .a691-discipline{display:grid;grid-template-columns:minmax(140px,1.8fr) repeat(3,minmax(83px,1fr));gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #28303C;font-size:12px}',
'#ops-audit-691 .a691-discipline b{font-weight:600;text-align:right;white-space:nowrap;font-size:11px}',
'#ops-audit-691 .a691-dhead{color:#92A1B4;font-size:10px}#ops-audit-691 .a691-difference{font-size:12px;margin-top:12px;display:flex;justify-content:space-between;gap:10px}',
'#ops-audit-691 .a691-difference b{color:#D4A017;white-space:nowrap}',
'@media(max-width:550px){#ops-audit-691 .a691-panel{padding:2px 10px 12px}#ops-audit-691 .a691-discipline{grid-template-columns:minmax(85px,1.7fr) repeat(3,minmax(55px,1fr));gap:5px;font-size:10px}#ops-audit-691 .a691-discipline b{font-size:10px}#ops-audit-691 .a691-kpi b{font-size:15px}}'
].join('\n');
const style=d.createElement('style');style.id='ops-audit-style-v691';style.textContent=styles;d.head.appendChild(style);
w.OperacoesAuditoria691=Object.freeze({brazilStamp,scope,records,summary,groups,discipline,disciplineSummary,monteCarlo,timeslot,weekday,render:mainPanel});
})();