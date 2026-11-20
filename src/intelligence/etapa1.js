/* v807: Inteligência contextual nas telas existentes; sem abas, timers ou dados privados no Worker. */
(function (w) {
  'use strict';
  if (w.DiarioInteligenciaEtapa1) return;
  const URL_BASE = 'https://diario-trader.lucianosilva43567.workers.dev';
  const state = { eventos: null, mercado: null, newsAt: 0, marketAt: 0, loadingNews: false, loadingMarket: false, route: '', abort: null };
  const escape = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = x => typeof x==='number' && Number.isFinite(x);
  const format = x => number(x) ? x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2}) : '—';
  const when = v => { const d=new Date(v);return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}) : 'Horário indisponível'; };
  const safeTicker = t => /^[A-Z0-9.^_-]{1,24}$/.test(String(t||'').toUpperCase()) ? String(t).toUpperCase() : '';
  function meusAtivos() {
    const set=new Set();
    /* Não antecipar retorno de jrMeusAtivos: a Lista de Olho e a Watchlist
       precisam ser unificadas, sem enviar os registros ao Worker público. */
    try {
      if (typeof S!=='undefined' && S) {
        for (const t of [...(S.watch||[]),...(S.olho||[]).map(x=>x.a)]) { const v=safeTicker(t);if(v)set.add(v); }
        for (const t of S.trades||[]) if (typeof isOpen==='function' && isOpen(t)) { const v=safeTicker(t.ativo||t.tk);if(v)set.add(v); }
        const qty=new Map();
        for (const p of S.cart?.lanc||[]) {
          const t=safeTicker(p.tk);if(!t)continue;
          qty.set(t,(qty.get(t)||0)+(p.tp==='V'?-1:p.tp==='C'?1:0)*Number(p.q||0));
        }
        for(const [t,v] of qty)if(v>0)set.add(t);
      }
    } catch (_) {}
    return [...set].slice(0,60);
  }
  function painel(title,desc) {
    const el=document.createElement('section');
    el.className='card';
    el.dataset.intelEtapa1='1';
    el.style.cssText='min-width:0;margin:8px 0 12px;overflow-wrap:normal;';
    el.innerHTML='<div class="top"><b>'+escape(title)+'</b><span class="mut sm" style="font-variant-numeric:tabular-nums">v807</span></div><div data-intel-content class="sm">'+escape(desc)+'</div>';
    return el;
  }
  function mercadoPlan() {
    const p=state.mercado;
    if (!p || !p.mercados || !Array.isArray(p.mercados.grupos)) return {nome:'Sem leitura validada',confianca:null,motivo:'Fonte pública ainda sem snapshot verificável.',divergencias:[],entries:[]};
    const entries=p.mercados.grupos.flatMap(g=>(g.itens||[]).map(x=>({name:String(x.n||''),change:Number(x.d1),fonte:p.fonte})))
      .concat((p.adrs||[]).map(x=>({name:String(x.s||''),change:Number(x.chp),fonte:p.fonte})))
      .filter(x=>number(x.change)&&Math.abs(x.change)<=60);
    const relevant=entries.filter(x=>!/ouro/i.test(x.name));
    if(relevant.length<6)return {nome:'Amostra insuficiente',confianca:null,motivo:'São necessários pelo menos 6 instrumentos com variações verificadas.',divergencias:[],entries};
    const pos=relevant.filter(x=>x.change>0).length/relevant.length;
    const magnitude=relevant.reduce((a,x)=>a+Math.abs(x.change),0)/relevant.length;
    const find=re=>entries.find(x=>re.test(x.name))?.change;
    const ewz=find(/EWZ/i),dxy=find(/^DXY$/i),dolar=find(/USD\/BRL/i),petroleo=find(/Brent|WTI/i),pbr=find(/^PBR$/i),sp=find(/S&P 500/i),nq=find(/Nasdaq$/i);
    let nome='Lateralização / Consolidação';
    if(number(dxy)&&number(ewz)&&dxy>0.4&&ewz< -0.6)nome='Aversão ao Risco';
    else if(magnitude>2.2&&pos>0.35&&pos<0.65)nome='Alta Volatilidade (proxy diária)';
    else if(pos>=0.67)nome='Tendência de Alta (amplitude diária)';
    else if(pos<=0.33)nome='Tendência de Baixa (amplitude diária)';
    const coerencia=Math.abs(pos-0.5)*2;
    const confianca=Math.min(80,Math.round(25+Math.min(relevant.length/16,1)*30+coerencia*25));
    const divergencias=[];
    if(number(petroleo)&&number(pbr)&&Math.sign(petroleo)!==Math.sign(pbr)&&Math.abs(petroleo-pbr)>0.8)
      divergencias.push('Petróleo '+format(petroleo)+'% × ADR Petrobras '+format(pbr)+'% — desacoplamento, sem inferir causa.');
    if(number(dxy)&&number(dolar)&&Math.sign(dxy)!==Math.sign(dolar)&&Math.abs(dxy-dolar)>0.5)
      divergencias.push('DXY '+format(dxy)+'% × USD/BRL '+format(dolar)+'% — direções divergentes.');
    if(number(sp)&&number(nq)&&Math.sign(sp)!==Math.sign(nq)&&Math.abs(sp-nq)>0.6)
      divergencias.push('S&P 500 '+format(sp)+'% × Nasdaq '+format(nq)+'% — forças relativas diferentes.');
    return {nome,confianca,motivo:'Classificação heurística por amplitude e direção diária; não mede volatilidade intradiária nem prevê preços.',divergencias,entries};
  }
  function timeline() {
    const out=state.eventos;
    return Array.isArray(out?.eventos)?out.eventos:[];
  }
  function relacionados() {
    const ativos=new Set(meusAtivos());
    return timeline().filter(e=>e&&Array.isArray(e.tickers)&&e.tickers.some(t=>ativos.has(t)));
  }
  function rowsEvent(events,limit=5) {
    if(!events.length)return '<p class="mut sm">Nenhum acontecimento confirmado nas fontes atualmente carregadas.</p>';
    const mine=new Set(meusAtivos());
    return events.slice(0,limit).map(e=>{
      const ticker=(e.tickers||[]).filter(t=>mine.has(t)).slice(0,5);
      const first=(e.fontes||[]).at(-1);
      const source=first&&/^https:\/\//.test(first.url) ? '<a href="'+escape(first.url)+'" target="_blank" rel="noopener noreferrer">'+escape(first.nome||'Fonte')+'</a>' : escape(first?.nome||'Fonte indisponível');
      return '<div style="padding:9px 0;border-bottom:1px solid var(--bd,#1E232E);min-width:0"><b>'+escape(e.titulo)+'</b>'+
        '<div class="mut sm">'+escape(e.tema)+' · '+escape(e.prioridade)+' · '+when(e.ultimaAtualizacao)+' · '+source+' · '+(e.quantidadeFontes||e.fontes?.length||0)+' fonte(s)</div>'+
        (ticker.length?'<div style="margin-top:5px">'+ticker.map(t=>'<button type="button" class="btn s" data-intel-ticker="'+escape(t)+'" style="margin:2px;min-height:40px">'+escape(t)+'</button>').join('')+'</div>':'')+
        '<button type="button" class="btn s" data-intel-study="'+escape(e.id)+'" style="min-height:40px;margin:5px 0">Estudar impacto</button>'+
        '<div class="mut sm" style="margin-top:4px">Impactos indiretos: hipóteses econômicas, não causalidades comprovadas.</div></div>';
    }).join('');
  }
  function transmissao(e) {
    const titulo=String(e?.titulo||'').toLowerCase();
    if(e?.tema==='petroleo')return 'Petróleo → Petrobras e setor de energia → Ibovespa/WIN';
    if(e?.tema==='minerio')return 'Minério de ferro → Vale e siderurgia → Ibovespa/WIN';
    if(e?.tema==='politica_economica'){
      if(/cpi|payroll|fed|fomc|treasur/.test(titulo))return 'Indicador EUA → Treasuries → dólar global → USD/BRL/WDO e Ibovespa/WIN';
      if(/ipca|copom|selic/.test(titulo))return 'Indicador Brasil → curva DI → câmbio → empresas e WIN/WDO';
    }
    return 'Evento → expectativas e prêmio de risco → preços de mercado (hipótese sem causalidade demonstrada)';
  }
  function riscoTerminal() {
    if(typeof S==='undefined'||!S)return '<p class="mut sm">Diário não carregado para esta sessão.</p>';
    const hoje=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
    const trades=(S.trades||[]).filter(t=>String(t.dtx||t.dt||'').slice(0,10)===hoje);
    let saldo=null,limite=null;
    try {
      if(typeof dayPL==='function'&&typeof dayFech==='function')saldo=dayPL(dayFech(hoje));
      if(typeof limPerda==='function')limite=limPerda((S.days||{})[hoje]||{});
    }catch(_){}
    const fechados=trades.filter(t=>typeof isOpen==='function'?!isOpen(t):t.exit!=null);
    const resultados=fechados.slice().sort((a,b)=>String(a.dtx||a.dt).localeCompare(String(b.dtx||b.dt)))
      .map(t=>{try{return typeof cBRL==='function'?cBRL(t)?.pl:null;}catch(_){return null;}})
      .filter(number);
    let losses=0;
    for(let i=resultados.length-1;i>=0&&resultados[i]<0;i--)losses++;
    const semStop=(S.trades||[]).filter(t=>{
      try{return typeof isOpen==='function'&&isOpen(t) && !(Number(t.stop)>0);}catch(_){return false;}
    });
    const avisos=[];
    if(number(limite)&&limite>0&&number(saldo)){
      if(saldo<=-limite)avisos.push('Limite diário cadastrado atingido. Não iniciar novas operações.');
      else if(saldo<=-0.8*limite)avisos.push('Consumo de 80% ou mais do limite de perda diário.');
    }
    if(losses>=3)avisos.push('Sequência de '+losses+' perdas encerradas: revisar tamanho da próxima posição.');
    if(semStop.length)avisos.push(semStop.length+' operação(ões) sinalizada(s) como aberta(s) sem stop válido.');
    const maxT=Number((S.days||{})[hoje]?.maxT);
    if(maxT>0&&trades.length>=maxT)avisos.push('Quantidade máxima de trades do dia registrada ('+maxT+').');
    return '<div class="sm">Perda/ganho do dia (registros locais): <b>'+ (number(saldo)?'R$ '+format(saldo):'indisponível')+'</b>'+
      (limite>0?' · limite de perda: R$ '+format(limite):' · limite não configurado')+
      ' · n = '+fechados.length+' trade(s) encerrado(s)</div>'+
      (avisos.length?avisos.map(x=>'<div class="warn" style="margin:5px 0">'+escape(x)+'</div>').join(''):
      '<p class="mut sm">Sem violação detectada nos registros carregados. Confirme o estado real da conta e do Profit.</p>')+
      '<p class="mut sm">Somente leitura. Não envia ordens, não modifica trades ou limites.</p>';
  }
  function briefing() {
    const m=mercadoPlan(),hot=timeline().filter(e=>e.prioridade==='alta');
    const mine=relacionados().filter(e=>e.prioridade==='alta');
    return '<div><b>Regime: '+escape(m.nome)+'</b> <span class="mut">Confiança heurística: '+(m.confianca==null?'—':m.confianca+'%')+'</span></div>'+
      '<p class="mut sm">Fonte: '+escape(state.mercado?.fonte||'não verificada')+' · Leitura: '+when(state.mercado?.atualizadoEm)+' · '+escape(m.motivo)+'</p>'+
      '<div><b>O que movimenta o mercado</b> <span class="mut sm">· '+mine.length+' relevante(s) aos seus ativos</span></div>'+rowsEvent(hot.slice(0,3),3)+
      hot.slice(0,2).map(e=>'<p class="mut sm"><b>Hipótese de transmissão:</b> '+escape(transmissao(e))+'</p>').join('');
  }
  function agenda() {
    const events=timeline().filter(e=>e.tema==='politica_economica').slice(0,5);
    return '<p class="mut sm">Agenda inteligente: confrontar Anterior × Consenso × Realizado somente quando a fonte trouxer os três dados. Surpresa = Realizado − Consenso.</p>'+
      '<div><b>Eventos e transmissão potencial</b></div>'+rowsEvent(events,5)+
      events.slice(0,3).map(e=>'<p class="mut sm"><b>Hipótese econômica:</b> '+escape(transmissao(e))+'</p>').join('')+
      '<p class="mut sm">CPI/Fed → Treasuries → USD/BRL → WIN/WDO/DI é hipótese de transmissão, não causalidade provada.</p>'+
      '<p class="mut sm">Reações históricas 5m/15m/60m: aguardando série sincronizada com horário de divulgação, sem simulação de números.</p>';
  }
  function noticias() {
    const mine=relacionados();
    const pushAtivo=typeof NP!=='undefined' && NP.on?.intel===true;
    const count=mine.filter(e=>e.prioridade==='alta').length;
    return '<div><b>Linha do tempo de acontecimentos</b> <span class="mut sm">Atualizada: '+when(state.eventos?.atualizadoEm)+(state.eventos?.desatualizado?' · DADOS ATRASADOS':'')+'</span></div>'+
      '<p class="mut sm">Agrupamento de matérias repetidas; notícias não representam recomendações nem fatos verificados independentemente da fonte.</p>'+
      '<div class="sm"><b>Alertas ligados aos seus ativos: '+count+'</b> · triagem feita somente neste dispositivo.</div>'+
      '<div class="sm" style="margin:6px 0"><button type="button" class="btn s" data-intel-push="1" style="min-height:40px">'+
      (pushAtivo?'Desativar alertas Web Push por ativo':'Ativar alertas Web Push por ativo')+'</button> '+
      '<button type="button" class="btn s" data-intel-notify="1" style="min-height:40px">Avisos locais (app aberto)</button></div>'+
      '<p class="mut sm">Web Push usa sua inscrição existente em Configurações → Alertas. Não envia valores nem operações; somente os tickers escolhidos. O aviso do servidor é entregue após a sincronização da preferência.</p>'+
      rowsEvent(mine.length?mine:timeline(),8);
  }
  function terminal() {
    const m=mercadoPlan(),news=relacionados().filter(e=>e.prioridade==='alta');
    return '<div><b>Regime: '+escape(m.nome)+'</b> · Confiança heurística '+(m.confianca==null?'—':m.confianca+'%')+'</div>'+
      '<p class="mut sm">'+escape(m.motivo)+' · Fonte: '+escape(state.mercado?.fonte||'indisponível')+' · '+when(state.mercado?.atualizadoEm)+'</p>'+
      '<b>Radar de divergências</b>'+(m.divergencias.length?'<div>'+m.divergencias.map(x=>'<p>'+escape(x)+'</p>').join('')+'</div>':'<p class="mut sm">Nenhuma divergência validada com os instrumentos disponíveis; não equivale a ausência de risco.</p>')+
      '<b>Acontecimentos ligados aos seus ativos</b>'+rowsEvent(news,3)+
      '<b>Guardião preventivo de risco</b>'+riscoTerminal();
  }
  function eligibleRoute() {
    if (typeof tab==='undefined')return '';
    if(tab==='home')return 'home';
    if(tab==='term')return 'term';
    if(tab==='mercado'&&typeof MKT!=='undefined'){
      if(MKT.tab==='ag')return 'agenda';
      if(['nt','jr'].includes(MKT.tab))return 'noticias';
    }
    return '';
  }
  function mount() {
    const route=eligibleRoute(),app=document.getElementById('app');
    if(!app)return;
    if(route!==state.route) {
      state.abort?.abort();
      state.abort=route?new AbortController():null;
      state.route=route;
      if(route && w.DiarioInteligencia?.subscribe){
        w.DiarioInteligencia.subscribe('ativo:selecionado',repaint,state.abort.signal);
      }
    }
    app.querySelectorAll('[data-intel-etapa1]').forEach(x=>x.remove());
    if(!route)return;
    const native=route==='term'?(app.querySelector('.tf413-dashboard')||app.querySelector('.dt393-native-term')||app):
      app.querySelector('.dt393-workspace .dt393-native')||app.querySelector('.dt393-native')||app;
    const title={home:'Inteligência de abertura e regime',agenda:'Agenda econômica inteligente',noticias:'Notícias por acontecimento e por ativo',term:'Inteligência do Terminal · regime e divergências'}[route];
    const box=painel(title,'Consultando dados públicos compartilhados. Sem acesso às suas operações no Worker.');
    native.prepend(box);
    const content=box.querySelector('[data-intel-content]');
    content.innerHTML=({home:briefing,agenda,noticias,term:terminal}[route])();
    if(!state.abort?.signal.aborted)refresh();
  }
  async function request(path,signal) {
    const response=await fetch(URL_BASE+path,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',signal});
    if(!response.ok)throw new Error('HTTP '+response.status);
    return response.json();
  }
  function repaint() {
    if(!state.route)return;
    const el=document.querySelector('#app [data-intel-etapa1] [data-intel-content]');
    if(el)el.innerHTML=({home:briefing,agenda,noticias,term:terminal}[state.route])();
  }
  function refresh() {
    const signal=state.abort?.signal;if(!signal || signal.aborted)return;
    const now=Date.now();
    if(!state.loadingNews && now-state.newsAt>120000){
      state.loadingNews=true;
      request('/v2/eventos',signal).then(data=>{
        if(signal.aborted)return;
        if(Array.isArray(data.eventos)){state.eventos=data;state.newsAt=Date.now();repaint();avaliarAvisos();}
      }).catch(()=>{}).finally(()=>state.loadingNews=false);
    }
    if(!state.loadingMarket && now-state.marketAt>300000) {
      state.loadingMarket=true;
      request('/v1/mercado',signal).then(data=>{
        if(signal.aborted)return;
        if(data.mercados){state.mercado=data;state.marketAt=Date.now();repaint();}
      }).catch(()=>{}).finally(()=>state.loadingMarket=false);
    }
  }
  function avaliarAvisos() {
    if(!w.Notification || Notification.permission!=='granted')return;
    if(typeof NP!=='undefined' && NP.on?.intel===true && typeof AL!=='undefined' && AL.sub)return;
    let enabledAt=0;
    try{enabledAt=Number(localStorage.getItem('diario-intel-avisos-since')||0);}catch(_){}
    if(!enabledAt)return;
    const mine=relacionados().filter(e=>e.prioridade==='alta' && (e.relacoes?.diretos||[]).some(x=>meusAtivos().includes(x)));
    for(const e of mine.slice(0,5)) {
      const published=Date.parse(e.ultimaAtualizacao);
      if(!Number.isFinite(published)||published<enabledAt||Date.now()-published>15*60000)continue;
      const tag='diario-intel-'+e.id+'-'+published;
      try {
        if(localStorage.getItem(tag))continue;
        localStorage.setItem(tag,'1');
        navigator.serviceWorker?.ready.then(reg=>reg.showNotification('Diário de Trader · '+(e.relacoes.diretos||[]).join(', '),{
          body:String(e.titulo||'').slice(0,180)+' · '+(e.fontes?.at(-1)?.nome||'Fonte')+' · '+when(e.ultimaAtualizacao),
          tag,data:{go:'mercado',r:'nt'}
        })).catch(()=>{});
      }catch(_){}
    }
  }
  document.addEventListener('click',async event=>{
    const tick=event.target.closest('[data-intel-ticker]');
    if(tick){
      const value=safeTicker(tick.dataset.intelTicker);
      if(value)w.DiarioInteligencia?.selectAsset(value,state.route);
      return;
    }
    if(event.target.closest('[data-intel-push]')){
      if(typeof NP==='undefined')return;
      NP.on ||= {};
      NP.on.intel=NP.on.intel!==true;
      if(typeof alSave==='function')alSave();
      if(typeof turnoPushSync==='function') {
        try{await turnoPushSync(true);}catch(_){}
      }
      repaint();
      return;
    }
    if(!event.target.closest('[data-intel-notify]'))return;
    if(!('Notification' in w))return;
    try {
      const status=await Notification.requestPermission();
      if(status==='granted'){localStorage.setItem('diario-intel-avisos-since',String(Date.now()));}
      repaint();
    }catch(_){}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)state.abort?.abort();
    else if(state.route){state.abort=new AbortController();refresh();}
  });
  if(w.TraderUI?.onRender)w.TraderUI.onRender('inteligencia-integrada-v807',mount);
  w.DiarioInteligenciaEtapa1=Object.freeze({meusAtivos,mercadoPlan,relacionados,todosEventos:timeline,refresh,inspect:()=>({route:state.route,newsAt:state.newsAt,marketAt:state.marketAt})});
})(window);
