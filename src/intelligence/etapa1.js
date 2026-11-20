/* v807: Inteligência contextual nas telas existentes; sem abas, timers ou dados privados no Worker. */
(function (w) {
  'use strict';
  if (w.DiarioInteligenciaEtapa1) return;
  const URL_BASE = 'https://diario-trader.lucianosilva43567.workers.dev';
  const state = { eventos: null, mercado: null, newsAt: 0, marketAt: 0, loadingNews: false, loadingMarket: false, route: '', abort: null, fluxo: null, flowAt: 0, flowBusy: false, memoria: null, boundary: null, sessionKey: '', analogia: null, analogiaAt: 0, analogiaBusy: false, extras: null, extrasAt: 0, extrasBusy: false, agenda: null, agendaAt: 0, agendaBusy: false };
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
    /* v833: notícia importante já vem com o estudo aberto; as demais ficam numa linha, sem botões. */
    return events.slice(0,limit).map(e=>{
      const first=(e.fontes||[]).at(-1);
      const source=first&&/^https:\/\//.test(first.url) ? '<a href="'+escape(first.url)+'" target="_blank" rel="noopener noreferrer">'+escape(first.nome||'Fonte')+'</a>' : escape(first?.nome||'Fonte indisponível');
      const imp=importante(e);
      return '<div class="i833-row'+(imp?' imp':'')+'">'+(imp?tag(oficial(e)?'fato':'publicada'):'')+sentTag(e)+'<b>'+escape(e.titulo)+'</b>'+
        '<div class="mut sm">'+when(e.ultimaAtualizacao)+' · '+source+((e.quantidadeFontes||e.fontes?.length||0)>1?' · '+(e.quantidadeFontes||e.fontes.length)+' fontes':'')+'</div>'+
        (imp?estudo(e):'')+'</div>';
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

  /* v833: ligação notícia → ativo com o motivo, em linguagem simples. Regras fixas (sem IA, sem custo). */
  const LIGA=[
    [/min[eé]rio|iron ore|vale\b|vale3|vale s\.?a/i,'VALE3','A Vale vive da venda de minério de ferro: preço e demanda do minério mexem direto no resultado dela.'],
    [/petr[oó]leo|brent|wti|\bopep|\bopec|petrobras|petr4|\boil\b|crude/i,'PETR4','A Petrobras vende petróleo e derivados: o preço do barril e decisões da empresa mudam receita e dividendos.'],
    [/sider|a[cç]o\b|steel|gerdau/i,'GGBR4','Gerdau é siderúrgica: preço do aço, minério e tarifas de importação afetam a margem.'],
    [/selic|copom|juros futuros|\bdi\b|ipca|infla[cç][aã]o/i,'ITUB4','Bancos e varejo reagem a juros: Selic e inflação mudam crédito, inadimplência e custo de capital.'],
    [/d[oó]lar|c[aâ]mbio|usd\/?brl|real brasileiro/i,'SUZB3','Suzano exporta celulose em dólar: câmbio mais alto aumenta a receita em reais.'],
    [/fed\b|fomc|powell|warsh|treasur|payroll|\bcpi\b/i,'WIN','Juros americanos mexem no dólar global e no apetite por emergentes, e isso chega ao índice futuro (WIN) e ao dólar (WDO).'],
    [/banco do brasil|bbas3/i,'BBAS3','Notícia sobre o Banco do Brasil afeta diretamente a ação.'],
    [/ita[uú]|itub4/i,'ITUB4','Notícia sobre o Itaú afeta diretamente a ação.'],
    [/eletrobras|elet3/i,'ELET3','Notícia sobre a Eletrobras afeta diretamente a ação.'],
    [/ambev|abev3/i,'ABEV3','Notícia sobre a Ambev afeta diretamente a ação.'],
    [/\bweg\b|wege3/i,'WEGE3','Notícia sobre a WEG afeta diretamente a ação.'],
    [/bitcoin|cripto|crypto|\bbtc\b|ether/i,'BTC','Cripto costuma andar junto com o apetite a risco: queda forte em cripto sinaliza aversão a risco.']
  ];
  function ligar(e) {
    const txt=String(e?.titulo||'')+' '+String(e?.tema||''),out=[],vistos=new Set();
    for(const [re,tk,porque] of LIGA)if(re.test(txt)&&!vistos.has(tk)){vistos.add(tk);out.push({tk,porque});}
    for(const tk of (e?.tickers||[]))if(!vistos.has(tk)){vistos.add(tk);out.push({tk,porque:'A notícia cita '+tk+' diretamente.'});}
    return out.slice(0,3);
  }
  /* v838: tom da notícia para o ativo (positiva · negativa · neutra), por regras fixas em PT e EN, sem IA. */
  const SENT_POS=/\b(alta|sobe|subiu|dispara|disparou|avan[cç]a|recorde|lucro (cresce|sobe|recorde)|supera|acima do esperado|eleva|aumenta (dividendo|produ)|aprova|compra de a[cç][oõ]es|recompra|upgrade|rally|surge|soar|beat|beats|raises|record)\b/i;
  const SENT_NEG=/\b(queda|cai|caiu|despenca|desaba|recua|recuou|preju[ií]zo|abaixo do esperado|rebaixa|corta|reduz|suspende|multa|investiga[cç][aã]o|greve|acidente|rompimento|downgrade|plunge|falls|drops|miss|misses|cuts|probe|lawsuit|recall)\b/i;
  function sentimento(e) {
    const t=String(e?.titulo||''),p=SENT_POS.test(t),n=SENT_NEG.test(t);
    return p&&!n?'pos':n&&!p?'neg':'neu';
  }
  const SENT_TXT={pos:'Positiva',neg:'Negativa',neu:'Neutra'};
  const sentTag=e=>{const k=sentimento(e);return '<span class="i838-sent i838-'+k+'">'+SENT_TXT[k]+'</span> ';};
  /* v838: a notícia toca um ativo seu (lista de olho, posição aberta ou carteira)? */
  function minha(e) {
    const meus=new Set(meusAtivos());if(!meus.size)return false;
    return (e?.tickers||[]).some(t=>meus.has(t))||ligar(e).some(l=>meus.has(l.tk));
  }
  /* Só o que importa recebe estudo automático: prioridade alta, fato oficial (CVM/B3/BC/Fed) ou média ligada a um ativo. */
  function importante(e) { return !!e&&(e.prioridade==='alta'||oficial(e)||(e.prioridade==='media'&&ligar(e).length>0)); }
  function estudo(e) {
    const lig=ligar(e);
    return '<div class="i833-estudo"><div class="sm"><b>Por que importa:</b> '+escape(transmissao(e))+'.</div>'+
      (lig.length?'<ul class="i833-lig">'+lig.map(l=>'<li><button type="button" class="btn s" data-intel-ticker="'+escape(l.tk)+'" style="min-height:40px">'+escape(l.tk)+'</button><span>'+escape(l.porque)+'</span></li>').join('')+'</ul>':'')+
      '<button type="button" class="i833-lab" data-intel-study="'+escape(e.id)+'">Abrir no laboratório</button></div>';
  }
  function fatosHtml() {
    const lista=timeline().filter(e=>importante(e)||minha(e)).sort((a,b)=>minha(b)-minha(a)).slice(0,5);
    if(!lista.length)return '<header><h2>Fatos que importam hoje</h2></header><p class="mut sm">Nenhuma notícia importante ligada aos seus ativos ou ao mercado nas fontes carregadas.</p>';
    return '<header><h2>Fatos que importam hoje</h2><span class="ui-badge">'+lista.length+' de '+timeline().length+' notícias</span></header>'+
      lista.map(e=>'<article class="i833-fato">'+tag(oficial(e)?'fato':'publicada')+sentTag(e)+(minha(e)?'<span class="i838-meu">Seu ativo</span> ':'')+'<b>'+escape(e.titulo)+'</b><div class="mut sm">'+when(e.ultimaAtualizacao)+' · '+escape((e.fontes||[]).at(-1)?.nome||'Fonte')+'</div>'+estudo(e)+'</article>').join('');
  }
  function analogiaHtml() {
    const a=state.analogia;
    if(!a||!a.hoje)return '';
    const nomes={spx:'S&P 500',ndx:'Nasdaq',ibov:'Ibovespa',ouro:'Ouro',btc:'Bitcoin',petroleo:'Petróleo'};
    const pct=v=>v==null?'—':(v>0?'+':'')+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const cor=v=>v==null?'':v>=0?' class="ui-g"':' class="ui-r"';
    const hoje=Object.entries(a.hoje).map(([k,v])=>'<span>'+escape(nomes[k]||k)+' <b'+cor(v)+'>'+pct(v)+'</b></span>').join('');
    const u=a.ultima;
    return '<header><h2>'+escape(a.titulo||'Movimento do dia')+'</h2><span class="ui-badge">'+escape(a.padrao||'')+'</span></header>'+
      '<div class="i833-hoje">'+hoje+'</div>'+
      (u?'<p class="sm"><b>Última vez parecida: '+escape(new Date(u.data+'T12:00:00Z').toLocaleDateString('pt-BR'))+'</b> ('+escape(u.diasAtras)+' pregões atrás). '+
        'Naquele dia: '+Object.entries(u.dia||{}).map(([k,v])=>escape(nomes[k]||k)+' '+pct(v)).join(' · ')+'.</p>'+
        '<p class="sm">Nos 5 pregões seguintes: S&amp;P '+pct(u.depois5?.spx)+' · Ibovespa '+pct(u.depois5?.ibov)+'. '+escape(a.vezes||0)+' dia(s) parecido(s) desde '+escape(a.desde||'')+'.</p>'
        :'<p class="mut sm">Nenhum dia parecido nos últimos anos de histórico.</p>')+
      '<p class="mut sm">Histórico diário (Yahoo, via Cloudflare). Comparação de direção, não previsão.</p>';
  }

  /* v835: sinais entre mercados — gap de amanhã (depois das 17h) e pares que se separaram hoje. */
  function sinaisHtml() {
    const x=state.extras;if(!x)return '';
    const pct=v=>v==null?'—':(v>0?'+':'')+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const b3=w.DiarioSessoes?.session('B3')?.state;
    const gap=x.gap&&b3!=='regular'?'<div class="i835-bloco"><b>Gap de amanhã</b><p class="sm">'+escape(x.gap.texto)+'</p></div>':'';
    const q=(x.pares||[]).filter(p=>p.quebrou);
    const pares=q.length?'<div class="i835-bloco"><b>Correlação quebrada hoje</b>'+q.map(p=>'<p class="sm"><b>'+escape(p.a)+' '+pct(p.hojeA)+'</b> × <b>'+escape(p.b)+' '+pct(p.hojeB)+'</b> — costumam andar juntos (correlação de 60 dias '+escape(String(p.correlacao60).replace('.',','))+'). '+escape(p.porque)+'</p>').join('')+'</div>':'';
    if(!gap&&!pares)return '';
    return '<header><h2>Sinais entre mercados</h2><span class="ui-badge">Cloudflare · Yahoo</span></header>'+gap+pares+'<p class="mut sm">Leitura automática de dados públicos; não é recomendação.</p>';
  }
  function chaveEvento(t){return String(t||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/\b(nov|dez|jan|fev|mar|abr|mai|jun|jul|ago|set|out)\.?\s*\d{4}\b/g,'').replace(/[^a-z0-9à-ú ]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);}
  /* v835: eventos fortes da semana com a reação do Ibovespa nas vezes anteriores (o histórico cresce a cada dia). */
  function reacoesHtml() {
    let ag=null;try{ag=JSON.parse(localStorage.getItem('diario-agenda')||'null');}catch(_){}
    const v=ag&&(ag.v||ag),evs=[];[0,1].forEach(k=>{const e=v&&v[k]&&v[k].eventos;if(Array.isArray(e))evs.push(...e);});
    const agora=Date.now(),rx=state.extras?.reacoes||{};
    const prox=evs.filter(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&Date.parse(e.em)>agora-36e5).sort((a,b)=>Date.parse(a.em)-Date.parse(b.em)).slice(0,6);
    if(!prox.length)return '';
    const pct=v=>(v>0?'+':'')+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    return '<div class="i835-bloco"><b>Como o Ibovespa reagiu nas vezes anteriores</b>'+prox.map(e=>{
      const h=rx[chaveEvento(e.t)]||[];
      return '<p class="sm"><span class="n">'+escape(new Date(Date.parse(e.em)).toLocaleString('pt-BR',{weekday:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}))+'</span> · '+escape(e.t)+' — '+
        (h.length?h.slice(0,6).map(x=>'<b class="'+(x.ibov>=0?'ui-g':'ui-r')+'">'+pct(x.ibov)+'</b>').join(' '):'<span class="mut">histórico começa a ser gravado a partir deste evento</span>')+'</p>';
    }).join('')+'</div>';
  }
  /* v835: por que o ativo mexeu — notícias ligadas, motivo do setor e o par de referência. */
  function porQue(tk) {
    tk=String(tk||'').toUpperCase();if(!tk)return '';
    const evs=timeline().filter(e=>ligar(e).some(l=>l.tk===tk)||String(e.titulo||'').toUpperCase().includes(tk)).slice(0,3);
    const regra=LIGA.find(r=>r[1]===tk);
    const par=(state.extras?.pares||[]).find(p=>p.a===tk);
    const pct=v=>v==null?'—':(v>0?'+':'')+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    if(!evs.length&&!regra&&!par)return '<p class="mut sm">Sem notícia ligada a '+escape(tk)+' nas fontes carregadas.</p>';
    return (regra?'<p class="sm"><b>O que costuma mexer:</b> '+escape(regra[2])+'</p>':'')+
      (par?'<p class="sm"><b>Hoje:</b> '+escape(par.a)+' '+pct(par.hojeA)+' × '+escape(par.b)+' '+pct(par.hojeB)+(par.quebrou?' — separou do par.':' — andando junto com o par.')+'</p>':'')+
      (evs.length?'<p class="sm"><b>Notícias ligadas:</b></p><ul class="i835-nts">'+evs.map(e=>'<li>'+escape(e.titulo)+' <span class="mut">'+when(e.ultimaAtualizacao)+'</span></li>').join('')+'</ul>':'');
  }
  /* v838: pontos para amanhã — montados sozinhos no pós-mercado a partir dos registros do dia e da agenda;
     ficam no aparelho e aparecem no Início até a abertura da próxima sessão. Sem Supabase. */
  const PONTOS_KEY='dt-pontos-amanha-v1';
  function pontosDoDia(hoje, proxima) {
    if(typeof S==='undefined'||!S)return null;
    const trades=(S.trades||[]).filter(t=>String(t.dtx||t.dt||'').slice(0,10)===hoje);
    const pts=[];
    let saldo=null,limite=null;
    try{if(typeof dayPL==='function'&&typeof dayFech==='function')saldo=dayPL(dayFech(hoje));if(typeof limPerda==='function')limite=limPerda((S.days||{})[hoje]||{});}catch(_){}
    const pl=trades.map(t=>{try{return typeof cBRL==='function'?cBRL(t)?.pl:null;}catch(_){return null;}}).filter(number);
    const ganhos=pl.filter(x=>x>0).length,perdas=pl.filter(x=>x<0).length;
    if(trades.length)pts.push('No dia: '+trades.length+' trade(s), '+ganhos+' com ganho e '+perdas+' com perda'+(number(saldo)?' · resultado '+saldo.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'')+'.');
    else pts.push('Dia sem trades registrados.');
    if(number(limite)&&limite>0&&number(saldo)&&saldo<=-0.8*limite)pts.push('O dia usou '+Math.round(-saldo/limite*100)+'% do limite de perda: amanhã comece com a mão menor.');
    let seq=0;for(let i=pl.length-1;i>=0&&pl[i]<0;i--)seq++;
    if(seq>=2)pts.push('O dia terminou com '+seq+' perdas seguidas: rever o que mudou nesses trades antes de operar.');
    const semStop=trades.filter(t=>!(Number(t.stop)>0)).length;
    if(semStop)pts.push(semStop+' trade(s) sem stop registrado: definir o stop antes da entrada.');
    const maxT=Number((S.days||{})[hoje]?.maxT);
    if(maxT>0&&trades.length>maxT)pts.push('Passou do máximo de '+maxT+' trades do dia.');
    const evs=(state.agenda?.eventos||[]).filter(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&e.em&&new Date(e.em).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})===proxima)
      .slice(0,3).map(e=>new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' '+String(e.t||'').slice(0,60));
    if(evs.length)pts.push('Agenda forte em '+br(proxima)+': '+evs.join(' · ')+'.');
    return {de:hoje,para:proxima,pontos:pts.slice(0,5),em:new Date().toISOString()};
  }
  function pontosHtml() {
    const c=w.DiarioSessoes?.context();if(!c)return '';
    const fase=w.DiarioSessaoVisual?.manual?.()||c.phase,hoje=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
    let p=null;try{p=JSON.parse(localStorage.getItem(PONTOS_KEY)||'null');}catch(_){}
    if(fase==='post'&&c.mode!=='b3_fechada'&&c.b3?.nextDate){
      const novo=pontosDoDia(hoje,c.b3.nextDate);
      if(novo&&JSON.stringify(novo.pontos)!==JSON.stringify(p?.pontos)){p=novo;try{localStorage.setItem(PONTOS_KEY,JSON.stringify(p));}catch(_){}}
    }
    if(!p||!Array.isArray(p.pontos)||!p.pontos.length)return '';
    const vale=(fase==='post'&&p.de===hoje)||((fase==='pre'||c.mode==='b3_fechada')&&p.para>=hoje&&p.de<hoje);
    if(!vale)return '';
    return '<header><h2>'+(p.de===hoje?'Pontos para amanhã':'Pontos de '+escape(br(p.de))+' para hoje')+'</h2><span class="ui-badge">automático</span></header>'+
      '<ul class="i838-pontos">'+p.pontos.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>'+
      '<p class="mut sm">Montado dos seus registros no aparelho e da agenda pública. Não é recomendação.</p>';
  }
  function cardsInicio(app) {
    const home=app.querySelector('.v829-home');if(!home)return;
    const kp=home.querySelector(':scope>.v829-kpis');
    let an=home.querySelector('#i833-analogia');const ah=analogiaHtml();
    if(ah){if(!an){an=document.createElement('section');an.id='i833-analogia';an.className='ui-card i833-card';(kp||home.firstElementChild)?.after(an);}if(an.innerHTML!==ah)an.innerHTML=ah;}else an?.remove();
    let si=home.querySelector('#i835-sinais');const sh=sinaisHtml();
    if(sh){if(!si){si=document.createElement('section');si.id='i835-sinais';si.className='ui-card i833-card';(home.querySelector('#i833-analogia')||kp||home.firstElementChild)?.after(si);}if(si.innerHTML!==sh)si.innerHTML=sh;}else si?.remove();
    let po=home.querySelector('#i838-pontos');const ph=pontosHtml();
    if(ph){if(!po){po=document.createElement('section');po.id='i838-pontos';po.className='ui-card i833-card';(kp||home.firstElementChild)?.after(po);}if(po.innerHTML!==ph)po.innerHTML=ph;}else po?.remove();
    const main=home.querySelector('.v829-split>.ui-main');if(!main)return;
    let f=home.querySelector('#i833-fatos');if(!f){f=document.createElement('section');f.id='i833-fatos';f.className='ui-card i833-card';main.prepend(f);}
    const fh=fatosHtml();if(f.innerHTML!==fh)f.innerHTML=fh;
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
    const events=timeline().filter(e=>e.tema==='politica_economica'&&importante(e)).slice(0,5);
    return reacoesHtml()+'<div><b>Eventos que movem o mercado</b> <span class="mut sm">Surpresa = Realizado − Consenso, só quando a fonte traz os três.</span></div>'+rowsEvent(events,5);
  }

  function noticias() {
    const pushAtivo=typeof NP!=='undefined' && NP.on?.intel===true;
    const todas=timeline(),c=w.DiarioSessoes?.context(),fase=w.DiarioSessaoVisual?.manual?.()||c?.phase;
    /* v838: no pregão, primeiro o que toca os seus ativos; o resto vem depois. */
    const meus=fase==='during'?todas.filter(minha):[],sem=todas.filter(e=>!meus.includes(e));
    const imp=sem.filter(importante),resto=sem.filter(e=>!importante(e));
    return (meus.length?'<div><b>Dos seus ativos</b> <span class="mut sm">pregão aberto · '+meus.length+' notícia(s)</span></div>'+rowsEvent(meus,6):'')+
      '<div><b>Importantes agora</b> <span class="mut sm">'+imp.length+' de '+todas.length+' · atualizada '+when(state.eventos?.atualizadoEm)+(state.eventos?.desatualizado?' · DADOS ATRASADOS':'')+'</span></div>'+
      rowsEvent(imp,6)+
      (resto.length?'<details class="i833-mais"><summary>Outras '+resto.length+' notícias agrupadas</summary>'+rowsEvent(resto,12)+'</details>':'')+
      '<details class="i833-mais"><summary>Alertas por ativo</summary><div class="sm" style="margin:6px 0"><button type="button" class="btn s" data-intel-push="1" style="min-height:40px">'+
      (pushAtivo?'Desativar alertas Web Push por ativo':'Ativar alertas Web Push por ativo')+'</button> '+
      '<button type="button" class="btn s" data-intel-notify="1" style="min-height:40px">Avisos locais (app aberto)</button></div>'+
      '<p class="mut sm">Web Push usa sua inscrição em Configurações → Alertas e envia só os tickers escolhidos. Notícias não são recomendação.</p></details>';
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
    if(!box){box=painel(title,'Consultando dados públicos compartilhados.',route==='term');box.dataset.route=route;if(route==='term'||route==='noticias'||route==='agenda')native.append(box);else native.prepend(box);}
    if(route==='term'){const r=box.querySelector('[data-intel-resumo]');const m=mercadoPlan();const t=' · '+(m.nome||'Sem leitura validada');if(r&&r.textContent!==t)r.textContent=t;}
    const content=box.querySelector('[data-intel-content]');
    const html=({home:briefing,dia:meuDia,agenda,noticias,term:terminal}[route])();
    if(content.innerHTML!==html)content.innerHTML=html;
    if(route==='home')cardsInicio(app);
    armSession();
    if(!state.abort?.signal.aborted)refresh();
  }
  async function request(path,signal) {
    if(w.DiarioPublico)return w.DiarioPublico.get(path,{signal,ttl:path==='/v1/mercado'?300000:path==='/v1/fluxo'?3600000:path==='/v1/analogia'||path==='/v1/extras'?900000:120000});
    const response=await fetch(URL_BASE+path,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',signal});
    if(!response.ok)throw new Error('HTTP '+response.status);
    return response.json();
  }
  function repaint() {
    if(!state.route)return;
    const el=document.querySelector('#app [data-intel-etapa1] [data-intel-content]');
    if(el){const html=({home:briefing,dia:meuDia,agenda,noticias,term:terminal}[state.route])();if(el.innerHTML!==html)el.innerHTML=html;}
    if(state.route==='home'){const app=document.getElementById('app');if(app)cardsInicio(app);}
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
    if(['home','agenda'].includes(state.route)&&!state.extrasBusy&&now-state.extrasAt>900000){
      state.extrasBusy=true;state.extrasAt=now;request('/v1/extras',signal).then(data=>{if(!signal.aborted&&data&&data.pares){state.extras=data;repaint();}}).catch(()=>{}).finally(()=>state.extrasBusy=false);
    }
    if(state.route==='home'&&!state.agendaBusy&&now-state.agendaAt>1800000){
      state.agendaBusy=true;state.agendaAt=now;request('/v1/agenda?semana=0',signal).then(data=>{if(!signal.aborted&&data&&Array.isArray(data.eventos)){state.agenda=data;repaint();}}).catch(()=>{}).finally(()=>state.agendaBusy=false);
    }
    if(state.route==='home'&&!state.analogiaBusy&&now-state.analogiaAt>900000){
      state.analogiaBusy=true;state.analogiaAt=now;request('/v1/analogia',signal).then(data=>{if(!signal.aborted&&data&&data.hoje){state.analogia=data;repaint();}}).catch(()=>{}).finally(()=>state.analogiaBusy=false);
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
  w.DiarioInteligenciaEtapa1=Object.freeze({montar:mount,porQue,sentimento,minha,pontosDoDia,meusAtivos,mercadoPlan,relacionados,todosEventos:timeline,refresh,inspect:()=>({route:state.route,newsAt:state.newsAt,marketAt:state.marketAt})});
  mount();
})(window);
