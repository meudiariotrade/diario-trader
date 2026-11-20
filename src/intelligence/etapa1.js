/* v807: Inteligência contextual nas telas existentes; sem abas, timers ou dados privados no Worker. */
(function (w) {
  'use strict';
  if (w.DiarioInteligenciaEtapa1) return;
  const URL_BASE = 'https://diario-trader.lucianosilva43567.workers.dev';
  const state = { eventos: null, mercado: null, newsAt: 0, marketAt: 0, loadingNews: false, loadingMarket: false, route: '', abort: null, fluxo: null, flowAt: 0, flowBusy: false, memoria: null, boundary: null, sessionKey: '' };
  const escape = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = x => typeof x==='number' && Number.isFinite(x);
  const format = x => number(x) ? x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2}) : '—';
  const when = v => { const d=new Date(v);return Number.isFinite(d.getTime()) ? d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}) : 'Horário indisponível'; };
  /* v811: datas técnicas ISO viram pt-BR na tela. */
  const br = d => { const m=/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(d||'')); return m ? m[3]+'/'+m[2]+'/'+m[1]+(m[4]?' '+m[4]+':'+m[5]:'') : String(d||''); };
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
  /* v811: classificação padronizada (P1-04). Toda frase da inteligência leva um destes selos. */
  const CLS={fato:'Fato confirmado',publicada:'Informação publicada',observado:'Dado observado',interpretacao:'Interpretação',hipotese:'Hipótese',cenario:'Cenário condicionado',indisponivel:'Indisponível'};
  const tag=k=>'<span class="v811-cls v811-cls-'+k+'">'+CLS[k]+'</span> ';
  const oficial=e=>(e?.fontes||[]).some(f=>/^https:\/\/([a-z0-9-]+\.)*(gov\.br|cvm\.gov\.br|b3\.com\.br|sec\.gov|federalreserve\.gov|bcb\.gov\.br|ibge\.gov\.br|bls\.gov)(\/|$)/i.test(String(f?.url||'')));
  /* v811: memória previsto × ocorrido do termômetro (P1-05). Grava no aparelho; não usa rede. */
  function memoriaPrevisao(c){
    const M=w.DiarioMemoriaPrevisao,T=w.TermometroAbertura670;if(!M||!T||!c)return '';
    const sess=c.b3?.date;if(!sess)return '';
    try{
      if(c.mode==='pre'&&c.win?.date===sess)M.registrarPrevisao(sess,T.capturar());
      if(c.mode==='pos'&&c.b3?.verified)M.registrarFechamento(sess,{...T.observado(),fonte:state.mercado?.fonte||''});
    }catch(_){}
    if(c.mode!=='pos'&&c.mode!=='b3_fechada'&&c.mode!=='cripto_macro')return '';
    const alvo=c.mode==='pos'?sess:c.anchorDate;const a=M.avaliar(M.ler()[alvo]);
    if(!a)return '<div class="v811-pxo"><h4>Previsto × ocorrido</h4><p class="mut sm">'+tag('indisponivel')+'Sem leitura do termômetro salva antes da abertura de '+escape(String(alvo||'').split('-').reverse().join('/'))+'. A memória começa a valer a partir do próximo pré-mercado com dados.</p></div>';
    const h=M.historico();
    return '<div class="v811-pxo"><h4>Previsto × ocorrido · '+escape(String(alvo).split('-').reverse().join('/'))+'</h4>'+
      '<div class="v811-pxo-tab">'+a.itens.map(i=>'<div class="v811-pxo-row v811-r-'+(i.resultado==='direção confirmada'?'ok':i.resultado==='direção contrária'?'contra':'inc')+'"><b>'+escape(i.nome)+'</b><span>'+tag('hipotese')+'Previsto: '+escape(i.previsto)+'</span><span>'+(i.ocorrido==='Dados insuficientes'?tag('indisponivel'):tag('observado'))+'Ocorrido: '+escape(i.ocorrido)+'</span><span><b>'+escape(i.resultado)+'</b> — '+escape(i.porque)+'</span></div>').join('')+'</div>'+
      '<p class="mut sm">Leitura salva '+when(a.leituraEm)+(a.insumos.length?' com '+escape(a.insumos.join(', ')):'')+'. '+escape(a.aviso)+'</p>'+
      (h.sessoes>1?'<p class="mut sm">Histórico no aparelho: '+h.sessoes+' sessões · '+h.confirmadas+' direção confirmada · '+h.contrarias+' contrária · '+h.inconclusivas+' inconclusiva.</p>':'')+'</div>';
  }
  function painel(title,desc,compact) {
    if(compact){
      /* v811: no Terminal a inteligência fica recolhida no fim do painel, numa linha,
         para não ocupar a tela de trabalho. Conteúdo e motores preservados. */
      const el=document.createElement('details');
      el.className='intel-compact';
      el.dataset.intelEtapa1='1';
      el.innerHTML='<summary><b>'+escape(title)+'</b><span class="mut sm" data-intel-resumo></span></summary><div data-intel-content class="sm">'+escape(desc)+'</div>';
      return el;
    }
    const el=document.createElement('section');
    el.className='card';
    el.dataset.intelEtapa1='1';
    el.style.cssText='min-width:0;margin:8px 0 12px;overflow-wrap:normal;';
    el.innerHTML='<div class="top"><b>'+escape(title)+'</b></div><div data-intel-content class="sm">'+escape(desc)+'</div>';
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

    const confianca=null; // Não atribuir confiança percentual sem validação estatística.
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
    const latest=Array.isArray(out?.eventos)?out.eventos:[];
    const c=w.DiarioSessoes?.context(),stored=state.memoria&&state.memoria.anchorDate===c?.anchorDate?state.memoria.eventos||[]:[];
    const map=new Map();for(const e of [...stored,...latest])if(e?.id)map.set(e.id,e);
    return [...map.values()].sort((a,b)=>String(b.ultimaAtualizacao).localeCompare(String(a.ultimaAtualizacao)));
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
      return '<div style="padding:9px 0;border-bottom:1px solid var(--bd,#1E232E);min-width:0">'+tag(oficial(e)?'fato':'publicada')+'<b>'+escape(e.titulo)+'</b>'+
        '<div class="mut sm">'+escape(e.tema)+' · '+escape(e.prioridade)+' · '+when(e.ultimaAtualizacao)+' · '+source+' · '+(e.quantidadeFontes||e.fontes?.length||0)+' fonte(s)</div>'+
        (ticker.length?'<div style="margin-top:5px">'+ticker.map(t=>'<button type="button" class="btn s" data-intel-ticker="'+escape(t)+'" style="margin:2px;min-height:40px">'+escape(t)+'</button>').join('')+'</div>':'')+
        '<button type="button" class="btn s" data-intel-study="'+escape(e.id)+'" style="min-height:40px;margin:5px 0">Estudar impacto</button>'+
        '<div class="mut sm" style="margin-top:4px">'+tag('hipotese')+'Impactos indiretos: hipóteses econômicas, não causalidades comprovadas.</div></div>';
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
  function contextoSessao(c) {
    if(!c)return '';
    const status=x=>({regular:'negociação regular',pre:'pré-mercado',post:'encerrado',fechado:'fechado',leilao:'leilão',desconhecido:'não verificado'}[x]||x);
    const date=x=>x?String(x).split('-').reverse().join('/'):'a confirmar';
    const names={fechamento:'fechamento',fato_relevante:'fatos relevantes',adr:'ADRs',commodities:'commodities',proxima_sessao:'próxima sessão',cripto:'cripto',macro:'macro',agenda:'agenda',ewz:'EWZ',eua:'EUA',futuros:'futuros',juros:'juros',balancos:'balanços',opcoes:'opções',urgente:'notícias urgentes',b3:'B3',cambio:'câmbio'};
    const label={pre:'Preparação da abertura',pregao:'Pregão brasileiro',pos:'Fechamento e próxima sessão',b3_fechada:'B3 fechada · referências internacionais',cripto_macro:'Fim de semana · cripto & macro'}[c.mode];
    const f=w.DiarioInterpretacao?.flow(state.fluxo?.linhas||[]);
    const latest=f?.last;
    let html='<p><b>'+escape(label||'Sessão não verificada')+'</b> · ações B3: '+escape(status(c.b3.state))+' · WIN: '+escape(status(c.win.state))+' · WDO: '+escape(status(c.wdo.state))+' · EUA: '+escape(status(c.us.state))+'</p>'+
      '<p class="mut sm">Próxima sessão B3: '+escape(date(c.b3.nextDate))+' · última referência B3: '+escape(date(c.anchorDate))+'. Acompanhar: '+escape(c.priorities.slice(0,4).map(x=>names[x]||x).join(', '))+'.</p>';
    if(c.warning)html+='<p class="warn">'+escape(c.warning)+'</p>';
    html+='<p class="mut sm">Cotações sem horário de negócio não comprovam negociação atual. Variações diárias não medem a mudança acumulada desde o fechamento B3.</p>';
    if(state.eventos?.desatualizado)html+='<p class="warn">Coleta de notícias atrasada ou offline; confira a publicação em cada fonte.</p>';
    if(latest)html+='<p>'+tag('observado')+'<b>Fluxo estrangeiro · '+escape(br(latest.d))+'</b> · '+escape(state.fluxo?.fonte||'fonte não identificada')+' · diário defasado. '+escape(f.text)+' Acumulado da amostra do mês: '+format(f.monthObserved)+' milhões de reais.</p>';
    try{const ib=typeof FE!=='undefined'&&FE.ibov;const dv=latest&&ib&&w.DiarioInterpretacao?.flowDivergence?.(state.fluxo?.linhas||[],ib.closes,'BOVA11');
      if(dv&&dv.classification!=='amostra_insuficiente')html+='<p>'+tag('interpretacao')+'<b>Fluxo × Ibovespa</b> (BOVA11, mesmas datas). '+escape(dv.text)+'</p>';}catch(_){}
    if(!latest)html+='<p class="mut sm">'+tag('indisponivel')+'Fluxo estrangeiro sem snapshot público disponível; consulte a área existente em Mercado.</p>';
    try {
      if(typeof SNT!=='undefined'&&SNT.v)for(const key of ['b3','eua','cripto']){
        const v=SNT.v[key];if(!v)continue;
        const method=key+':'+String(v.metodo||v.fonte||'metodologia existente');
        const history=(v.hist||[]).map(x=>({date:x.d||x.data,value:x.v,method}));
        if(number(v.ontem)&&v.data)history.push({date:w.DiarioSessoes.shift(v.data,-1),value:v.ontem,method});
        const reading=w.DiarioInterpretacao?.sentiment({date:v.data,value:v.valor},history,method);
        if(reading)html+='<p>'+tag('observado')+'<b>Sentimento '+escape(key.toUpperCase())+' · '+reading.value+'</b> · '+escape(br(reading.date))+' · Δ diário '+format(reading.daily)+' · Δ semanal '+format(reading.weekly)+'. '+escape(reading.text)+' '+escape(reading.accelText||'')+'</p>';
      }
    }catch(_){}
    const dates=[];
    try {if(typeof AG!=='undefined')for(const group of Object.values(AG.v||{}))for(const e of group.eventos||[]){const at=e.em||e.d||e.data;if(at&&String(at).slice(0,10)>=c.b3.date&&e.imp===1)dates.push(String(e.t||e.nome||e.titulo||'Evento econômico')+' · '+br(at));}}catch(_){}
    try {if(typeof BAL!=='undefined')for(const e of BAL.v?.proximos||[])if(e.d>=c.b3.date&&e.d<=(c.b3.nextDate||c.b3.date))dates.push(e.tk+' · balanço '+br(e.d)+' · '+(e.conf==='cvm'?'documento CVM':'data prevista, conferir publicação'));}catch(_){}
    try {for(const e of w.VencB3?.entre(c.b3.date,c.b3.nextDate||c.b3.date)||[])dates.push(e.t+' · '+br(e.d)+' (não implica direção de preço)');}catch(_){}
    if(dates.length)html+='<p><b>Acompanhar na agenda existente:</b> '+dates.slice(0,4).map(escape).join(' · ')+'</p>';
    const events=w.DiarioInterpretacao?.prioritize(timeline(),c)||[];
    for(const e of events.slice(0,3)){
      const scenario=w.DiarioInterpretacao?.adrScenario(e,state.mercado?.adrs||[],c);
      if(scenario)html+='<p>'+tag('cenario')+'<b>'+escape(scenario.ticker+' ↔ '+scenario.symbol)+'</b> · '+when(e.ultimaAtualizacao)+'. '+escape(scenario.text)+' '+escape(scenario.scenario)+' '+escape(scenario.note)+'</p>';
    }
    if(state.memoria?.anchorDate===c.anchorDate)html+='<p class="mut sm">Memória desde a sessão '+escape(br(c.anchorDate))+': '+state.memoria.eventos.length+' evento(s) preservado(s). '+escape(state.memoria.note)+'</p>';
    return html;
  }
  function meuDia(){
    const c=w.DiarioSessoes?.context(),manual=w.DiarioSessaoVisual?.manual?.(),
      phase=manual||c?.phase, data=c?.b3?.nextDate;
    const task=c?.mode==='cripto_macro'?'Mercado B3 fechado: revisar a rotina e preparar os próximos eventos.':
      c?.mode==='b3_fechada'?'B3 fechada: não tratar referências antigas como negociações em tempo real.':
      phase==='pre'?'Conferir cenário, regras e notícias antes de operar.':
      phase==='during'?'Acompanhar riscos, execução e operações abertas sem somá-las ao resultado realizado.':
      'Conciliar operações encerradas, checklist original e plano de amanhã.';
    return '<div class="v810-intel-day"><strong>Orientação da sessão</strong><p>'+escape(task)+'</p>'+
      '<small>Próxima sessão B3: '+escape(data?data.split('-').reverse().join('/'):'data não verificada')+
      ' · Fonte: calendário de negociação da B3 / regras do aplicativo</small></div>';
  }
  async function memorizar(){
    if(!w.DiarioPublico||!w.DiarioSessoes)return;
    const c=w.DiarioSessoes.context();
    const m=await w.DiarioPublico.remember(c,timeline(),state.mercado);
    if(m&&state.route){state.memoria=m;repaint();}
  }
  function armSession(){
    clearTimeout(state.boundary);state.boundary=null;if(document.hidden||!state.route||!w.DiarioSessoes)return;
    const now=Date.now(),next=w.DiarioSessoes.nextTransition(now);
    // Um único despertador para a próxima transição de calendário. Nenhum polling de rede.
    state.boundary=setTimeout(()=>{state.boundary=null;if(!state.route||document.hidden)return;if(['home','dia'].includes(state.route))w.DiarioSessaoVisual?.atualizar?.();repaint();refresh();armSession();},Math.max(1000,next-now));
  }
  function briefing() {
    const m=mercadoPlan(),context=w.DiarioSessoes?.context(),
      hot=w.DiarioInterpretacao?.prioritize(timeline(),context,Date.now(),context?.anchorAt?Date.parse(context.anchorAt):undefined)||
        timeline().filter(e=>e.prioridade==='alta');
    const mine=relacionados().filter(e=>e.prioridade==='alta');
    const phase=w.DiarioSessaoVisual?.manual?.()||context?.phase||'post';
    const title=phase==='pre'?'O que importa antes da abertura':phase==='during'?'O que está acontecendo agora':'O que importa para a próxima sessão';
    const atualizado=Date.parse(state.mercado?.atualizadoEm||'');
    const recent=Number.isFinite(atualizado)&&Date.now()-atualizado<20*60000&&atualizado<=Date.now()+60000;
    const fonte=escape(state.mercado?.fonte||'não verificada');
    const semLeitura=(m.nome==='Sem leitura validada'||m.nome==='Amostra insuficiente');
    const resumo=semLeitura?tag('indisponivel')+'Dados insuficientes para caracterizar o mercado nesta sessão.':
      tag('interpretacao')+'Variações disponíveis indicam: '+escape(m.nome)+'. A classificação não prevê preços.';
    const top=hot.slice(0,3).map(e=>{
      const data=when(e.ultimaAtualizacao),fonte=e.fontes?.find(f=>/^https:\/\/|^http:\/\//.test(f?.url));
      return '<li>'+tag(oficial(e)?'fato':'publicada')+'<b>'+escape(e.titulo||'Acontecimento publicado')+'</b>'+
        '<small> · '+escape(data)+' · '+escape(fonte?.nome||'Fonte não informada')+
        ' · efeito nos ativos depende de confirmação.</small></li>';
    }).join('')||'<li>Não há acontecimentos recentes com fontes identificadas.</li>';
    return '<div class="v810-intel-brief"><h3>'+title+'</h3>'+
      '<p><b>'+resumo+'</b></p>'+
      '<p class="mut sm">Fonte: '+fonte+' · '+(recent?'Atualizado: ':'Último registro (não é tempo real): ')+
        when(state.mercado?.atualizadoEm)+'</p>'+
      (context?.warning?'<p class="mut sm">'+escape(context.warning)+'</p>':'')+
      '<details><summary>Fatos publicados, hipóteses e fontes · '+mine.length+' ligados aos seus ativos</summary>'+
      '<ul class="v810-intel-events">'+top+'</ul>'+
      (hot.length?'<div><b>Hipóteses condicionadas</b></div>'+
        hot.slice(0,2).map(e=>'<p class="mut sm">'+tag('cenario')+escape(transmissao(e))+
        ' — cenário condicionado, não atribuição comprovada de causalidade.</p>').join(''):'')+
      '<p class="mut sm">'+escape(m.motivo)+'</p></details>'+memoriaPrevisao(context)+'</div>';
  }
  function agenda() {
    const events=timeline().filter(e=>e.tema==='politica_economica').slice(0,5);
    return '<p class="mut sm">Agenda inteligente: confrontar Anterior × Consenso × Realizado somente quando a fonte trouxer os três dados. Surpresa = Realizado − Consenso.</p>'+
      '<div><b>Eventos e transmissão potencial</b></div>'+rowsEvent(events,5)+
      events.slice(0,3).map(e=>'<p class="mut sm">'+tag('hipotese')+escape(transmissao(e))+'</p>').join('')+
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
    return '<div><b>Leitura descritiva: '+escape(m.nome)+'</b></div>'+
      '<p class="mut sm">'+escape(m.motivo)+' · Fonte: '+escape(state.mercado?.fonte||'indisponível')+' · '+when(state.mercado?.atualizadoEm)+'</p>'+
      '<b>Radar de divergências</b>'+(m.divergencias.length?'<div>'+m.divergencias.map(x=>'<p>'+escape(x)+'</p>').join('')+'</div>':'<p class="mut sm">Nenhuma divergência validada com os instrumentos disponíveis; não equivale a ausência de risco.</p>')+
      '<b>Acontecimentos ligados aos seus ativos</b>'+rowsEvent(news,3)+
      '<b>Guardião preventivo de risco</b>'+riscoTerminal();
  }
  function eligibleRoute() {
    if (typeof tab==='undefined')return '';
    if(tab==='home')return 'home';
    if(tab==='dia')return 'dia';
    if(tab==='term')return 'term';
    if(tab==='mercado'&&typeof MKT!=='undefined'){
      if(MKT.tab==='ag')return 'agenda';
      if(MKT.tab==='nt')return 'noticias'; // Jornal editorial não recebe o painel redundante.
    }
    return '';
  }
  function mount() {
    const route=eligibleRoute(),app=document.getElementById('app');
    try{if(typeof FE!=='undefined'&&!document.getElementById('febox'))FE.abort?.abort();}catch(_){}
    if(!app)return;
    try{
      if(typeof tab!=='undefined'&&tab==='mercado'&&typeof MKT!=='undefined'&&['mu','pn','cq'].includes(MKT.tab)){
        if(!app.querySelector('#febox')&&typeof feHtml==='function'){const host=app.querySelector('.dt393-native')||app;host.insertAdjacentHTML('beforeend',feHtml());}
        if(typeof feCarrega==='function')void feCarrega();
      }
    }catch(_){}
    if(route!==state.route) {
      state.abort?.abort();state.loadingNews=false;state.loadingMarket=false;state.flowBusy=false;
      state.abort=route?new AbortController():null;
      state.route=route;
      if(route && w.DiarioInteligencia?.subscribe){
        w.DiarioInteligencia.subscribe('ativo:selecionado',repaint,state.abort.signal);
      }
    }
    if(!route){app.querySelectorAll('[data-intel-etapa1]').forEach(x=>{if(x.dataset.intelNative){delete x.dataset.intelEtapa1;x.querySelector('[data-intel-content]')?.replaceChildren();}else x.remove();});clearTimeout(state.boundary);state.boundary=null;return;}
    const native=route==='term'?(app.querySelector('.trm')||app.querySelector('.dt393-native-term')||app):
      app.querySelector('.dt393-workspace .dt393-native')||app.querySelector('.dt393-native')||app;
    const title={home:'Central de Inteligência',dia:'Preparação e revisão da sessão',agenda:'Agenda econômica inteligente',noticias:'Notícias por acontecimento e por ativo',term:'Inteligência do Terminal'}[route];
    let box=app.querySelector('[data-intel-etapa1]');
    const central=route==='home'?app.querySelector('.v4-iacard'):route==='dia'?app.querySelector('.v810-day-context'):null;
    if(central&&box!==central){box?.remove();box=central;box.dataset.intelEtapa1='1';box.dataset.route=route;box.dataset.intelNative='1';}
    if(box&&box.dataset.route!==route){box.remove();box=null;}
    if(!box){box=painel(title,'Consultando dados públicos compartilhados.',route==='term');box.dataset.route=route;if(route==='term')native.append(box);else native.prepend(box);}
    if(route==='term'){const r=box.querySelector('[data-intel-resumo]');const m=mercadoPlan();const t=' · '+(m.nome||'Sem leitura validada');if(r&&r.textContent!==t)r.textContent=t;}
    const content=box.querySelector('[data-intel-content]');
    const html=({home:briefing,dia:meuDia,agenda,noticias,term:terminal}[route])();
    if(content.innerHTML!==html)content.innerHTML=html;
    armSession();
    if(!state.abort?.signal.aborted)refresh();
  }
  async function request(path,signal) {
    if(w.DiarioPublico)return w.DiarioPublico.get(path,{signal,ttl:path==='/v1/mercado'?300000:path==='/v1/fluxo'?3600000:120000});
    const response=await fetch(URL_BASE+path,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',signal});
    if(!response.ok)throw new Error('HTTP '+response.status);
    return response.json();
  }
  function repaint() {
    if(!state.route)return;
    const el=document.querySelector('#app [data-intel-etapa1] [data-intel-content]');
    if(el){const html=({home:briefing,dia:meuDia,agenda,noticias,term:terminal}[state.route])();if(el.innerHTML!==html)el.innerHTML=html;}
  }
  function refresh() {
    const signal=state.abort?.signal;if(!signal || signal.aborted)return;
    const now=Date.now();
    if(!state.loadingNews && now-state.newsAt>120000){
      state.loadingNews=true;
      request('/v2/eventos',signal).then(data=>{
        if(signal.aborted)return;
        if(Array.isArray(data.eventos)){state.eventos=data;state.newsAt=Date.now();repaint();memorizar();avaliarAvisos();}
      }).catch(()=>{}).finally(()=>state.loadingNews=false);
    }
    if(['home','dia'].includes(state.route)&&!state.flowBusy&&now-state.flowAt>3600000){
      state.flowBusy=true;state.flowAt=now;request('/v1/fluxo',signal).then(data=>{if(!signal.aborted&&Array.isArray(data.linhas)){state.fluxo=data;repaint();}}).catch(()=>{}).finally(()=>state.flowBusy=false);
    }
    if(!state.loadingMarket && now-state.marketAt>300000) {
      state.loadingMarket=true;
      request('/v1/mercado',signal).then(data=>{
        if(signal.aborted)return;
        if(data.mercados){state.mercado=data;state.marketAt=Date.now();repaint();memorizar();}
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
    if(document.hidden){try{if(typeof FE!=='undefined')FE.abort?.abort();}catch(_){}state.abort?.abort();clearTimeout(state.boundary);state.boundary=null;}
    else if(state.route){state.abort=new AbortController();repaint();armSession();refresh();}
  });
  w.DiarioPublico?.read('memoria').then(m=>{if(m){state.memoria=m;repaint();}}).catch(()=>{});
  if(w.TraderUI?.onRender)w.TraderUI.onRender('inteligencia-integrada-v807',mount);
  w.DiarioInteligenciaEtapa1=Object.freeze({montar:mount,meusAtivos,mercadoPlan,relacionados,todosEventos:timeline,refresh,inspect:()=>({route:state.route,newsAt:state.newsAt,marketAt:state.marketAt})});
  mount();
})(window);
