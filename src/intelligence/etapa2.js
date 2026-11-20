/* v808 — Integração nas telas Operações, Carteira, Análises e Estudos.
 * Cliente somente leitura: nenhum setInterval, escrita de trades ou consulta Supabase. */
(function(w,d){
 'use strict';
 if(w.DiarioInteligenciaEtapa2)return;
 const core=w.DiarioInteligenciaEtapa2Dados;
 if(!core)return;
 const URL='https://diario-trader.lucianosilva43567.workers.dev/v2/eventos';
 const state={route:'',abort:null,eventos:[],newsAt:0,newsBusy:false,fundAt:0,metricas:{},
  fundBusy:false,fundError:'',prevFund:{},saved:false};
 const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ok=x=>typeof x==='number'&&Number.isFinite(x);
 const num=x=>ok(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2}):'—';
 const pct=x=>ok(x)?num(x)+'%':'—';
 const date=x=>{const ts=Date.parse(x||'');return Number.isFinite(ts)?new Date(ts).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'sem horário verificável';};
 const ss=()=>typeof S!=='undefined'&&S?S:{};
 const posicoes=()=>{try{return typeof carSnap==='function'?carSnap():null}catch(_){return null}};
 const auditar=()=>core.auditarOperacoes(ss().trades||[],{
  isOpen:t=>typeof isOpen==='function'?isOpen(t):t.exit==null||t.exit==='',
  pnl:t=>{const x=typeof cBRL==='function'?cBRL(t):null;return x?.pl;},
  r:t=>{const x=typeof calc==='function'?calc(t):null;return x?.r;}
 });
 function historico(){
  try{const payload=JSON.parse(localStorage.getItem('diario-fundamentos-v808')||'{}');
    return payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};}catch{return {}}
 }
 function memorizarFundamentos(k,record){
  if(!record?.ticker||!record.referencia)return;
  try{
   const all=historico(),arr=Array.isArray(all[k])?all[k]:[];
   if(!arr.some(x=>x.referencia===record.referencia))arr.push(record);
   all[k]=arr.slice(-4);const keys=Object.keys(all).slice(-80);
   const compact=Object.fromEntries(keys.map(key=>[key,all[key]]));
   localStorage.setItem('diario-fundamentos-v808',JSON.stringify(compact));
  }catch(_){}
 }
 function mercadosAtivos(){
   const p=posicoes();return ['BR','US'].map(m=>({m,tickers:(p?.[m]?.pos||[])
     .map(x=>String(x.tk||'').toUpperCase()).filter(x=>/^[A-Z0-9.^_-]{2,24}$/.test(x)).slice(0,25)}))
     .filter(g=>g.tickers.length);
 }
 function obterMetricas(){
   if(state.fundBusy||Date.now()-state.fundAt<15*60000)return;
   if(!w.DiarioScreeners?.metricasPublicas)return;
   const markets=mercadosAtivos();if(!markets.length)return;
   state.fundBusy=true;state.fundAt=Date.now();state.fundError='';
   Promise.allSettled(markets.map(({m,tickers})=>w.DiarioScreeners.metricasPublicas(m,tickers)))
     .then(results=>{
       let count=0;
       results.forEach((o,i)=>{
         if(o.status!=='fulfilled'){state.fundError='Um dos mercados não trouxe snapshot público completo.';return;}
         const res=o.value;
         if(res.cacheHistorico){state.fundError='Snapshot offline acima do prazo de atualização; não concluir mudanças recentes.';}
         for(const row of res.rows||[]){
           const market=markets[i].m,key=market+':'+String(row.ticker||'').toUpperCase();
           const asOf=row.fundamentals_at||row.balance_date||res.reference;
           const next=core.extrairFundamentos(row,asOf);
           if(next.ticker&&next.referencia){
             const arr=historico()[key]||[];
             const previous=arr.filter(x=>x.referencia!==next.referencia).at(-1)||null;
             state.prevFund[key]=previous;
             memorizarFundamentos(key,next);
           }
           state.metricas[key]={...row,source:res.source,referencia:asOf,
             cacheHistorico:!!res.cacheHistorico,cacheOffline:!!res.cacheOffline};
           count++;
         }
       });
       if(!count&&!state.fundError)state.fundError='Não há métricas públicas verificáveis para os ativos da Carteira.';
       repaint();
     }).catch(()=>{state.fundError='Snapshot fundamentalista não disponível.';repaint()})
     .finally(()=>state.fundBusy=false);
 }
 function obterEventos(){
   const available=w.DiarioInteligenciaEtapa1?.todosEventos?.()||[];
   if(available.length){state.eventos=available;state.newsAt=Date.now();return;}
   if(state.newsBusy||Date.now()-state.newsAt<120000)return;
   state.newsBusy=true;state.newsAt=Date.now();
   (w.DiarioPublico?w.DiarioPublico.get('/v2/eventos',{signal:state.abort?.signal,ttl:120000}):fetch(URL,{method:'GET',mode:'cors',credentials:'omit',cache:'default',signal:state.abort?.signal}).then(r=>r.ok?r.json():null)).then(x=>{
       if(!x||!Array.isArray(x.eventos)||x.desatualizado)return;
       state.eventos=x.eventos;repaint();
     }).catch(()=>{}).finally(()=>state.newsBusy=false);
 }
 function painel(t,body){
   const e=d.createElement('section');e.className='card';e.dataset.intelEtapa2='1';
   e.style.cssText='margin:8px 0 12px;min-width:0;overflow-wrap:anywhere';
   e.innerHTML='<div class="top"><b>'+esc(t)+'</b></div><div data-intel-2-content class="sm">'+body+'</div>';
   return e;
 }
 function aviso(v){return '<div class="mut sm">'+esc(v)+'</div>';}
 function avisosAuditoria(a,limit=6){
   const rows=a.registros.filter(x=>x.falhas.length).slice(-limit).reverse();
   if(!rows.length)return aviso('Nenhuma pendência identificada nos registros fechados disponíveis.');
   return rows.map(t=>'<div class="sm" style="padding:8px 0;border-bottom:1px solid var(--bd)">'+
     '<b>'+esc(t.ativo||'Ativo não identificado')+'</b> · '+esc(t.dia)+' · '+esc(t.setup)+
     ' · '+(ok(t.resultado)?'Resultado R$ '+num(t.resultado):'resultado não calculável')+
     '<div>'+t.falhas.map(f=>'<div class="'+(f.tipo==='risco'?'r':'mut')+'">'+esc(f.texto)+'</div>').join('')+'</div></div>').join('');
 }
 function performance(a){
   let agenda=[];
   try{agenda=(typeof AG!=='undefined'&&Array.isArray(AG?.v)?AG.v:[])
       .flatMap(o=>o?.eventos||[]).filter(e=>e&&e.imp===1&&e.em).map(e=>String(e.em).slice(0,10));}catch(_){}
   const summary=core.resumoCondicoes(a.registros,'horario');
   const byRegime=core.resumoCondicoes(a.registros,'regime');
   const byCalendar=core.resumoCondicoes(a.registros,'agenda',{agendaDias:agenda});
   const renderGroups=(rows,max=6)=>rows.slice(0,max).map(x=>
     '<div class="sm" style="margin:5px 0"><b>'+esc(x.nome)+'</b> · n = '+x.n+' trade(s) · '+
     (x.amostraSuficiente?'resultado R$ '+num(x.resultado)+' · acerto '+pct(x.taxaAcerto):
     'amostra pequena; sem conclusão estatística')+'</div>').join('')||aviso('n = 0 trades com resultado verificável');
   return '<p class="mut sm">Resultado por condição dos trades fechados. Agrupamentos abaixo não atribuem causas e nunca aplicam regime atual a operações antigas.</p>'+
     '<b>Por horário</b>'+renderGroups(summary)+
     '<b>Por regime registrado na época</b>'+renderGroups(byRegime,4)+
     '<b>Calendário relevante (quando disponível)</b>'+renderGroups(byCalendar,3)+
     '<p class="mut sm">Volatilidade e regime sem histórico sincronizado: classificados como não informados. Para análise inferencial, ampliar a amostra e controlar instrumento e estratégia.</p>';
 }
 function operacoes(){
   const a=auditar();const percentual=a.n?Math.round(a.pendencias/a.n*100):0;
   return '<p><b>Auditor automático de trades encerrados</b></p>'+
     '<p class="sm">n = '+a.n+' operações fechadas · '+a.pendencias+' com pendências ('+percentual+'%) · '+a.graves+' alertas de risco/disciplina</p>'+
     '<p class="mut sm">Entrada, saída, tamanho, stop, setup, horário e disciplina confrontados com os campos existentes. Somente leitura: nenhum trade foi alterado.</p>'+
     avisosAuditoria(a)+
     '<div style="margin-top:10px"><b>Desempenho por condição de mercado</b></div>'+performance(a);
 }
 function exposure(){
   const p=posicoes();
   if(!p)return aviso('Os dados locais da Carteira não estão disponíveis nesta sessão.');
   const result=core.exposicaoCarteira(p,state.metricas);
   const joined=[];
   for(const m of result){
     if(!m.n)continue;
     joined.push('<div style="padding:8px 0"><b>'+esc(m.mercado)+' · '+esc(m.moeda)+'</b>'+
       ' · n = '+m.n+' posição(ões) · patrimônio nesta moeda '+num(m.total)+'</div>');
     if(m.maiorEmpresa)joined.push('<div class="sm">Maior emissor/ativo identificado: <b>'+esc(m.maiorEmpresa.nome)+'</b> · '+pct(m.maiorEmpresa.pct)+'</div>');
     joined.push('<div class="sm"><b>Concentração por setor</b>: '+m.setores.slice(0,5).map(x=>esc(x.nome)+' '+pct(x.pct)).join(' · ')+'</div>');
     joined.push('<div class="sm"><b>Exposição por emissor</b>: '+m.empresas.slice(0,5).map(x=>esc(x.nome)+' '+pct(x.pct)).join(' · ')+'</div>');
     joined.push('<div class="sm"><b>Fatores temáticos hipotéticos</b>: '+(m.fatoresHipoteticos.slice(0,5).map(x=>esc(x.nome)+' '+pct(x.pct)).join(' · ')||'Sem classificação explícita')+'</div>');
   }
   const my=new Set(result.flatMap(m=>m.empresas.map(v=>v.nome)).filter(Boolean));
   const tickers=new Set(mercadosAtivos().flatMap(x=>x.tickers));
   const tied=(state.eventos||[]).filter(e=>Array.isArray(e.tickers)&&e.tickers.some(t=>tickers.has(t))).slice(0,5);
   const ev=tied.map(e=>'<div style="padding:6px 0;border-bottom:1px solid var(--bd)"><b>'+esc(e.titulo)+'</b> · '+
     esc((e.tickers||[]).filter(t=>tickers.has(t)).slice(0,3).join(', '))+
     ' · '+date(e.ultimaAtualizacao)+' · '+esc(e.prioridade)+
     '<div class="mut sm">Associação com ativos não prova impacto causal; relações indiretas são hipóteses.</div></div>').join('');
   return '<p class="mut sm">Risco por mercado, setor, emissor e fator. BRL e USD não são somados sem cotação cambial confiável.</p>'+
     (joined.join('')||aviso('Sem posições com valor verificável.'))+
     '<div style="margin-top:8px"><b>Acontecimentos ligados às posições</b></div>'+
     (ev||aviso('Nenhum evento correlacionado disponível no cache público atual.'))+
     '<p class="mut sm">Setores vêm exclusivamente do screener público quando disponível; concentração não equivale a VaR ou recomendação.</p>';
 }
 function fundamental(onlyTicker){
   const groups=mercadosAtivos(),entries=groups.flatMap(({m,tickers})=>tickers.map(t=>[m+':'+t,m,t]));
   if(onlyTicker&&!entries.some(x=>x[2]===onlyTicker))return '';
   if(!entries.length)return aviso('Cadastre ativos na Carteira para acompanhar mudanças fundamentalistas.');
   let hit=0,html='';
   for(const [key,market,t] of entries.filter(x=>!onlyTicker||x[2]===onlyTicker).slice(0,12)){
     const raw=state.metricas[key];if(!raw)continue;hit++;
     const current=core.extrairFundamentos(raw,raw.referencia);
     const prev=state.prevFund[key]||null;
     const diff=core.mudaFundamentos(current,prev);
     html+='<div style="padding:8px 0;border-bottom:1px solid var(--bd)"><b>'+esc(t)+'</b> · '+esc(market)+
       ' · referência: '+esc(current.referencia||'não informada')+
       (raw.cacheOffline?' · cache offline':'')+
       (diff.comparavel?diff.mudancas.slice(0,5).map(k=>'<div class="sm">'+
         esc(k.indicador)+' · '+num(k.anterior)+' → '+num(k.atual)+
         ' ('+(k.delta>=0?'+':'')+num(k.delta)+') · '+esc(k.efeito)+'</div>').join(''):
         '<div class="mut sm">'+esc(diff.motivo)+'</div>')+'</div>';
   }
   return '<p class="mut sm">Comparação por fonte/data de balanço ou análise anterior, usando apenas snapshot já cacheado pela Cloudflare. Não extrapola múltiplos nem inventa trimestre.</p>'+
     (state.fundError?'<p class="mut">'+esc(state.fundError)+'</p>':'')+
     (state.fundBusy?aviso('Conferindo cache fundamentalista público…'):'')+
     (hit?html:aviso('Sem dados comparáveis disponíveis para as posições.'))+
     '<p class="mut sm">Os snapshots históricos são guardados somente neste navegador. Métrica ausente não recebe nota ou variação fictícia.</p>';
 }
 function estudo(){
   let ctx=null;try{ctx=JSON.parse(sessionStorage.getItem('diario-intel-estudo-v808')||'null')}catch(_){}
   const e=ctx||state.eventos?.[0]||null,theme=core.temaEstudo(e);
   return '<p class="mut sm">Aprendizagem conectada à agenda e aos acontecimentos reais. Abra uma história pelo botão “Estudar impacto” dentro de Notícias.</p>'+
     (e?'<p><b>'+esc(e.titulo||'Evento selecionado')+'</b> · '+date(e.ultimaAtualizacao)+'</p>':'')+
     '<p><b>'+esc(theme.tema)+'</b></p><p>'+esc(theme.mecanica)+'</p>'+
     '<p class="mut sm">Exploração econômica e educacional; não confundir hipótese de transmissão com causalidade comprovada ou recomendação.</p>'+
     '<button type="button" class="btn s" data-intel-estudo-voltar="1" style="min-height:40px">Consultar acontecimento em Mercado</button>';
 }
 function currentRoute(){
   if(typeof tab==='undefined')return '';
   if(['ops','trades','swing','opc','stats'].includes(tab))return 'operacoes';
   if(tab==='carteiras')return 'carteira';
   if(tab==='analises')return 'analises';
   if(tab==='estudos' && typeof ESV!=='undefined' && ESV==='eco')return 'estudos';
   return '';
 }
 function mount(){
   const app=d.getElementById('app');if(!app)return;
   const route=currentRoute(),changed=state.route!==route;
   if(changed){state.abort?.abort();state.abort=route?new AbortController():null;state.route=route;}
   if(!route){app.querySelectorAll('[data-intel-etapa2]').forEach(x=>x.remove());return;}
   if(route==='analises'){
     app.querySelectorAll('[data-intel-etapa2]').forEach(x=>x.remove());
     if(changed){obterMetricas();obterEventos();}
     integrarFundamental();return;
   }
   const el=route==='analises'?app.querySelector('#an-root')||app.querySelector('.dt393-native')||app:
     route==='estudos'?app.querySelector('.dt397-native-mount')||app.querySelector('.dt393-native')||app:
     app.querySelector('.dt393-native')||app.querySelector('.dt393-page')||app;
   const heading={operacoes:'Auditoria e condições operacionais',carteira:'Radar de risco da Carteira',
     analises:'Mudanças fundamentalistas verificáveis',estudos:'Estudos ↔ Mercado real'}[route];
   const html=({operacoes,carteira:exposure,analises:fundamental,estudos:estudo}[route])();
   let panel=app.querySelector('[data-intel-etapa2]');
   if(panel&&panel.dataset.route!==route){panel.remove();panel=null;}
   if(!panel){panel=painel(heading,html);panel.dataset.route=route;el.prepend(panel);}
   else {const node=panel.querySelector('[data-intel-2-content]');if(node.innerHTML!==html)node.innerHTML=html;}
   if(changed){
     if(route==='carteira'||route==='analises'){obterMetricas();obterEventos();}
     if(route==='estudos')obterEventos();
   }
 }
 function integrarFundamental(){
   // O conteúdo passa a fazer parte da explicação do ativo existente, sem card substituto.
   const node=d.querySelector('#scr-detail [data-fundamental-history]');
   if(node){const html=fundamental(node.dataset.fundamentalHistory);if(node.innerHTML!==html)node.innerHTML=html;}
 }
 function repaint(){
   if(!state.route)return;
   if(state.route==='analises'){integrarFundamental();return;}
   const node=d.querySelector('[data-intel-etapa2] [data-intel-2-content]');
   if(node)node.innerHTML=({operacoes,carteira:exposure,analises:fundamental,estudos:estudo}[state.route])();
 }
 function studySelected(eventId){
   const all=w.DiarioInteligenciaEtapa1?.todosEventos?.()||state.eventos||[];
   const found=all.find(e=>String(e?.id)===String(eventId));
   if(!found)return;
   const ctx={titulo:String(found.titulo||'').slice(0,180),tema:String(found.tema||''),ultimaAtualizacao:found.ultimaAtualizacao};
   try{sessionStorage.setItem('diario-intel-estudo-v808',JSON.stringify(ctx))}catch(_){}
   if(typeof ESV!=='undefined')ESV='eco';
   if(typeof irPara==='function')irPara('estudos');else if(typeof tab!=='undefined'){tab='estudos';if(typeof render==='function')render();}
 }
 d.addEventListener('click',e=>{
   const link=e.target.closest('[data-intel-study]');
   if(link){e.preventDefault();studySelected(link.dataset.intelStudy);return}
   if(e.target.closest('[data-intel-estudo-voltar]')){
     if(typeof MKT!=='undefined')MKT.tab='nt';
     if(typeof irPara==='function')irPara('mercado');
   }
 });
 if(w.TraderUI?.onRender)w.TraderUI.onRender('inteligencia-integrada-v808',mount);
 w.DiarioInteligenciaEtapa2=Object.freeze({auditar,exposure,estudo,fundamental,inspecionar:()=>({route:state.route,newsAt:state.newsAt,fundAt:state.fundAt})});
})(window,document);
