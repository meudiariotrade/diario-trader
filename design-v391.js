/* Diário de Trader · identidade de interface v391.
 * Camada visual progressiva sobre os dados e rotas reais da aplicação.
 * Não modifica Supabase, cálculos financeiros nem ordens; não cria cotações fictícias.
 */
(function () {
  'use strict';
  const doc = document;
  const KEY = 'dt391-layout';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    trade:'<path d="M4 7h16m-5-4 5 4-5 4M20 17H4m5-4-5 4 5 4"/>',
    chart:'<path d="M4 20V12m6 8V5m6 15v-9m5 9V3"/>',
    book:'<path d="M12 6c-3-2-6-2-10-2v16c4 0 7 0 10 2m0-16c3-2 6-2 10-2v16c-4 0-7 0-10 2z"/>',
    monitor:'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4"/>',
    briefcase:'<path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18"/>',
    shield:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
    newspaper:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h9M8 11h9M8 15h5M5 7h1M5 11h1M5 15h1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    edit:'<path d="m4 17 11-11 4 4L8 21H4zm9-9 4 4"/>',
    spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    right:'<path d="m9 5 7 7-7 7"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 5 6 13 0 18-6-5-6-13 0-18"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
    graduation:'<path d="m2 10 10-5 10 5-10 5zm4 3v5c4 3 8 3 12 0v-5m4-3v8"/>',
    arrowup:'<path d="m4 17 6-6 4 4 6-8M15 7h5v5"/>',
    alert:'<path d="m12 2 10 18H2zm0 7v5m0 3v.1"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    play:'<path d="m7 4 13 8-13 8z"/>',
    pause:'<path d="M8 5v14m8-14v14"/>'
  };
  const icon = (name,sz=21)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.chart}</svg>`;
  const safe = v=>typeof esc==='function'?esc(v):String(v??'');
  const fmt = n => Number.isFinite(+n) ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+n) : '—';
  const pc = (n, digits=2)=>Number.isFinite(n)?(n>0?'+':'')+n.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits})+'%':'—';
  const direction = n=>n>0?'positive':n<0?'negative':'';
  const moneyView=(value,empty='Sem dados') => value==null?empty:fmt(value);
  const currentDay=()=>typeof D==='string'?D:new Date().toISOString().slice(0,10);
  const today=()=>typeof loc==='function'?loc().slice(0,10):new Date().toISOString().slice(0,10);
  const tradeDate=t=>String(t.dtx||t.dt||'').slice(0,10);
  const result=t=>{ try { const c=typeof cBRL==='function'?cBRL(t):calc(t); return Number.isFinite(c?.pl)?c.pl:null; } catch { return null; } };
  const rr=t=>{try{const n=calc(t).r;return Number.isFinite(n)?n:null;}catch{return null;}};
  const trades=()=>Array.isArray(S?.trades)?S.trades:[];
  const closed=(date)=>trades().filter(t=>result(t)!==null&&(!date||tradeDate(t)===date));
  const openTrades=()=>trades().filter(t=>{try{return isOpen(t);}catch{return false;}});
  const sumResults=ts=>ts.reduce((s,t)=>s+(result(t)||0),0);
  const sumR=ts=>ts.reduce((s,t)=>s+(rr(t)||0),0);
  const capital=()=>{try{const rs=['D','S','O'].map(t=>capCalc(t)).filter(Boolean);if(rs.length)return rs.reduce((sum,x)=>sum+x.at,0);}catch{}const raw=Number(S?.prop?.cap);return raw>0?raw:null;};
  const dayData=()=>S?.days?.[currentDay()]||{};
  const dayTrades=()=>closed(currentDay());
  const goal=()=>Number(S?.prop?.meta||S?.goals?.meta||0)||null;
  const limit=()=>Number(S?.prop?.perdaDia||S?.goals?.perdaDia||0)||null;
  const section=(name,content,actions='')=>`<section class="dt391-card"><header class="dt391-cardhead"><h2>${icon(name)} ${content}</h2>${actions}</header>`;
  const endSection='</section>';
  const action=(txt,route,kind='')=>`<button type="button" class="dt391-action ${kind}" data-dt391-route="${route}">${txt} ${icon('right',15)}</button>`;
  const noData='<span class="dt391-muted">Não informado</span>';
  function header(){
    const title={home:'Início',dia:'Meu dia',ops:'Operações',trades:'Operações',mercado:'Mercado',term:'Terminal',estudos:'Estudos',stats:'Diário'}[tab]||'Diário de Trader';
    return `<header class="dt391-topbar"><div class="dt391-brand"><span class="dt391-brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Diário de Trader</span></div><span class="dt391-title">${title}</span><div class="dt391-topactions"><button aria-label="Pesquisar no aplicativo" type="button" data-dt391-action="search">${icon('search',23)}</button><button aria-label="Abrir notificações" type="button" data-dt391-route="mais">${icon('bell',23)}</button></div></header>`;
  }
  const instruments=['IBOV','S&P 500','NASDAQ','DXY','USD/BRL','PETR4'];
  // Os valores vêm somente de dados locais verificáveis; nenhum preço de exemplo é apresentado como cotação real.
  function quote(sym){
    // Apenas snapshots efetivamente recebidos pelo Terminal/Profit/Finnhub/TradingView.
    const alias={
      'IBOV':['IBOV','TVC:IBOV','BMFBOVESPA:IBOV'],
      'S&P 500':['SPX','SP:SPX','S&P 500'],
      'NASDAQ':['NDX','NASDAQ:NDX','NASDAQ'],
      'DXY':['DXY','TVC:DXY'],
      'USD/BRL':['USDBRL','FX_IDC:USDBRL','USD/BRL'],
      'PETR4':['PETR4','BMFBOVESPA:PETR4']
    }[sym]||[sym];
    try{
      const cache=window.TRM?.TR?.dados;
      if(!cache||typeof cache!=='object')return null;
      let best=null;
      for(const [key,entry] of Object.entries(cache)){
        if(!key.startsWith('cot|')||!Array.isArray(entry?.v?.itens))continue;
        const ts=Date.parse(entry.v.em)||entry.ts||0;
        if(!ts||ts>Date.now()+60000||Date.now()-ts>12*60*60*1000)continue;
        for(const item of entry.v.itens){
          const ids=[item?.pedido,item?.s,item?.simbolo].filter(Boolean).map(v=>String(v).toUpperCase());
          if(!alias.some(id=>ids.includes(id.toUpperCase())))continue;
          const px=Number(item.px);
          if(!Number.isFinite(px)||px<=0)continue;
          const change=item.d1!=null?Number(item.d1):null;
          if(!best||ts>best.ts)best={n:px,change:Number.isFinite(change)?change:null,ts};
        }
      }
      return best;
    }catch{return null;}
  }
  function ticker(){return `<div class="dt391-ticker" aria-label="Cotações; traços indicam ausência de dados verificados">${instruments.map(sym=>{const q=quote(sym);return `<div class="dt391-tick"><b>${safe(sym)}</b><strong>${q?q.n.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—'}</strong><small class="${q?direction(q.change):''}">${q&&q.change!=null?(pc(q.change)+(Date.now()-q.ts>30*60*1000?' · atrasado':'')):(q?'Cotação disponível':'Sem cotação')}</small></div>`}).join('')}</div>`;}
  function stat(label,value,detail='',state='',symbol='chart'){
    return `<div class="dt391-stat"><span class="dt391-stat-icon">${icon(symbol,22)}</span><span class="dt391-stat-label">${label}</span><strong class="${state}">${value}</strong>${detail?`<small>${detail}</small>`:''}</div>`;
  }
  function home(){
    const ts=dayTrades(), net=sumResults(ts),weekStart=typeof segundaDe==='function'?segundaDe(today()):today().slice(0,8)+'01';
    const week=closed().filter(t=>tradeDate(t)>=weekStart&&tradeDate(t)<=today());
    const cap=capital(), capName=cap===null?'Configure seu capital':fmt(cap);
    const goalVal=goal(), loss=limit();
    const rrules=S?.rules||[], nChecked=Object.entries(dayData().chk||{}).filter(([k,v])=>v&&rrules.some(r=>String(r.id)===k)).length;
    const date=new Date(today()+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    return `<div class="dt391-page dt391-home">
      <section class="dt391-card dt391-summary"><header class="dt391-cardhead"><h2>${icon('calendar')} Resumo do dia</h2><span class="dt391-market-status">${icon('chart',16)} Acompanhamento do pregão</span></header><p class="dt391-muted dt391-date">${safe(date)}</p><div class="dt391-kpis">
      <div><small>Capital</small><strong>${capName}</strong></div><div><small>P&L do dia</small><strong class="${direction(net)}">${net>0?'+':''}${fmt(net)}</strong></div><div><small>P&L da semana</small><strong class="${direction(sumResults(week))}">${sumResults(week)>0?'+':''}${fmt(sumResults(week))}</strong></div><div><small>Limite de perda</small><strong>${loss!=null?fmt(loss):'Não definido'}</strong></div></div></section>
      <div class="dt391-phase"><button data-dt391-route="dia">${icon('calendar',16)} Pré-mercado</button><button class="active" data-dt391-route="term">${icon('chart',16)} Pregão</button><button data-dt391-route="dia">${icon('book',16)} Pós-mercado</button></div>
      <div class="dt391-tiles">${[['chart','Mercado','Ações, índices e moedas','mercado'],['monitor','Terminal','Gráficos e inteligência','term'],['book','Diário','Performance e aprendizado','stats'],['graduation','Estudos','Aulas e materiais','estudos'],['check','Checklist','Rotina e disciplina','dia']].map(([ic,title,sub,r])=>`<button data-dt391-route="${r}" class="dt391-tile">${icon(ic,29)}<b>${title}</b><small>${sub}</small>${icon('right',17)}</button>`).join('')}</div>
      ${section('globe','Panorama do dia',action('Abrir mercado','mercado'))}<div class="dt391-panorama"><div><h3>${icon('calendar',17)} Agenda</h3><p>Consulte os eventos confirmados e os horários na fonte de mercado.</p>${action('Ver agenda','mercado')}</div><div><h3>${icon('newspaper',17)} Notícias-chave</h3><p>Manchetes do Brasil e exterior, com origem identificada.</p>${action('Ver notícias','mercado')}</div><div><h3>${icon('alert',17)} Alertas macro</h3><p>Juros, inflação, fluxo e outros eventos monitorados.</p>${action('Abrir radar','term')}</div></div>${endSection}
      ${section('spark','Central de Inteligência <span class="dt391-mini-ai">IA</span>')}<p class="dt391-muted">Análise contextual depende dos dados disponíveis. Sem sinais fabricados nem ordens automáticas.</p><div class="dt391-quicklist"><button data-dt391-route="term">${icon('target')} Radar global e oportunidades ${icon('right',16)}</button><button data-dt391-route="ops">${icon('shield')} Revisar operações e risco ${icon('right',16)}</button><button data-dt391-route="stats">${icon('arrowup')} Avaliar resultados e consistência ${icon('right',16)}</button></div>${endSection}
      ${section('bolt','Atalhos rápidos')}<div class="dt391-shortcuts"><button data-dt391-route="term">${icon('monitor')} Abrir Terminal</button><button data-dt391-action="newtrade">${icon('plus')} Registrar trade</button><button data-dt391-route="stats">${icon('book')} Rever Diário</button><button data-dt391-route="mercado">${icon('newspaper')} Ver notícias</button></div>${endSection}
      <div class="dt391-context">${nChecked} de ${rrules.length} regras marcadas hoje ${goalVal?' · Meta diária '+fmt(goalVal):''}</div>
      </div>`;
  }
  function day(){
    const ts=dayTrades(),net=sumResults(ts),rules=S?.rules||[],checked=rules.filter(r=>dayData().chk?.[r.id]).length;
    const progress=rules.length?Math.round(100*checked/rules.length):0;
    const cap=capital(), loss=limit(),g=goal();
    const checkpoints=rules.length?rules.slice(0,8).map(r=>`<label class="dt391-checkitem"><input type="checkbox" data-chk="${safe(r.id)}" ${dayData().chk?.[r.id]?'checked':''}/><span>${safe(r.t)}</span></label>`).join(''):'<p class="dt391-muted">Cadastre suas regras em Checklist para acompanhar o progresso.</p>';
    const text=safe(dayData().plano||'');
    return `<div class="dt391-page dt391-day">
      ${section('target','Plano do dia',`<span class="dt391-datechip">${safe(currentDay().split('-').reverse().join('/'))}</span>`)}<div class="dt391-plan"><div><small>Objetivo</small><strong class="positive">${g?fmt(g):'Não definido'}</strong></div><div><small>Risco limite</small><strong class="negative">${loss?fmt(loss):'Não definido'}</strong></div><div><small>Trades realizados</small><strong>${ts.length}</strong></div><div><small>Foco operacional</small><strong>${text?text.slice(0,90):'Defina seu plano'}</strong></div></div>${endSection}
      ${section('check','Checklist operacional',`<span class="dt391-progress-num">${checked} de ${rules.length} (${progress}%)</span>`)}<div class="dt391-progress"><span style="width:${progress}%"></span></div><div class="dt391-phase dt391-phase-inner"><button data-dt391-action="checkphase" data-phase="pre" class="active">Pré-mercado</button><button data-dt391-action="checkphase" data-phase="during">Durante</button><button data-dt391-action="checkphase" data-phase="post">Pós-mercado</button></div><div class="dt391-checklist">${checkpoints}</div><button class="dt391-outline" data-dt391-action="legacy">Abrir checklist e editar regras ${icon('right',16)}</button>${endSection}
      <div class="dt391-two">${section('briefcase','Capital e metas')}<div class="dt391-line"><span>Capital operacional</span><b>${moneyView(cap,'Não definido')}</b></div><div class="dt391-line"><span>Limite de perda (dia)</span><b class="negative">${moneyView(loss,'Não definido')}</b></div><div class="dt391-line"><span>Meta de ganho (dia)</span><b class="positive">${moneyView(g,'Não definido')}</b></div><div class="dt391-line"><span>Resultado registrado</span><b class="${direction(net)}">${fmt(net)}</b></div>${endSection}
      ${section('chart','Cenário atual')}<p class="dt391-muted">Cotações, juros e fluxo devem ser consultados nas respectivas fontes; dados não disponíveis não são estimados.</p><div class="dt391-quicklist"><button data-dt391-route="mercado">${icon('globe',16)} Mercado e notícias ${icon('right',15)}</button><button data-dt391-route="term">${icon('chart',16)} Radar Global / Juros ${icon('right',15)}</button></div>${endSection}</div>
      <div class="dt391-two">${section('calendar','Tarefas do dia')}<div class="dt391-quicklist"><button data-dt391-route="dia">${icon('check',16)} Seguir plano operacional ${icon('right',15)}</button><button data-dt391-route="ops">${icon('trade',16)} Revisar ${ts.length} trades ${icon('right',15)}</button><button data-dt391-route="stats">${icon('book',16)} Avaliar performance ${icon('right',15)}</button></div>${endSection}
      ${section('edit','Observações rápidas')}<p class="dt391-notes">${safe(dayData().resumo||dayData().plano||'Nenhuma observação registrada. Use o Diário para escrever e guardar suas anotações.')}</p><button class="dt391-outline" data-dt391-action="legacy">Editar observações ${icon('right',16)}</button>${endSection}</div>
      </div>`;
  }
  function operationRow(t){
    const v=result(t),r=rr(t), side=t.side==='C'?'Compra':'Venda', symbol=safe(t.ativo||'Ativo');
    return `<button type="button" class="dt391-oprow" data-a="edit" data-id="${safe(t.id)}"><span class="dt391-op-symbol ${side==='Compra'?'buy':'sell'}"><b>${symbol}</b><small>${safe(t.setup||'Sem setup')}</small></span><span class="dt391-op-side ${side==='Compra'?'buy':'sell'}">${side}</span><span class="dt391-op-values"><strong class="${direction(v)}">${v==null?'Aberta':(v>0?'+':'')+fmt(v)}</strong><small>${r==null?'R não calculado':(r>0?'+':'')+r.toFixed(2).replace('.',',')+' R'}</small></span>${icon('right',16)}</button>`;
  }
  function operations(){
    const open=openTrades(),cl=dayTrades(),net=sumResults(cl), riskOpen=open.reduce((a,t)=>{try{return a+(calc(t).risk||0)}catch{return a}},0);
    const gains=cl.filter(t=>result(t)>0).length;
    return `<div class="dt391-page dt391-operations"><div class="dt391-statgrid">${stat('Operações abertas',String(open.length),'Somente monitoramento','', 'briefcase')}${stat('Resultado do dia',(net>0?'+':'')+fmt(net),cl.length+' encerradas',direction(net),'chart')}${stat('Risco teórico aberto',fmt(riskOpen),'Conforme stops cadastrados','', 'shield')}${stat('Setups hoje',String(new Set(cl.map(t=>t.setup).filter(Boolean)).size),'Nos trades encerrados','', 'target')}</div>
      ${section('layers','Posições monitoradas',`<span class="dt391-muted">${open.length} aberta(s)</span>`)}<div class="dt391-tablewrap"><table class="dt391-table"><thead><tr><th>Ativo</th><th>Lado</th><th>Entrada</th><th>Stop</th><th>Alvo</th><th>Status</th></tr></thead><tbody>${open.map(t=>`<tr><td><b>${safe(t.ativo||'—')}</b></td><td class="${t.side==='C'?'positive':'negative'}">${t.side==='C'?'Compra':'Venda'}</td><td>${safe(t.entry||'—')}</td><td>${safe(t.stop||'—')}</td><td>${safe(t.target||'—')}</td><td><button data-a="edit" data-id="${safe(t.id)}">Ver detalhes</button></td></tr>`).join('')||'<tr><td colspan="6" class="dt391-empty">Nenhuma operação aberta registrada.</td></tr>'}</tbody></table></div>${endSection}
      ${section('trade','Trades do dia',`<span class="dt391-muted">${cl.length} trades</span>`)}<div class="dt391-oplist">${cl.slice(0,15).map(operationRow).join('')||'<p class="dt391-muted">Nenhum trade encerrado no dia selecionado.</p>'}</div><button class="dt391-outline" data-dt391-action="legacy">Ver todos os trades e filtros ${icon('right',16)}</button>${endSection}
      <div class="dt391-two">${section('edit','Revisão rápida')}<p class="dt391-muted">Registre os principais pontos desta sessão.</p><div class="dt391-quicklist"><button data-dt391-route="dia">${icon('book',17)} Registrar aprendizado ${icon('right',15)}</button><button data-dt391-route="stats">${icon('chart',17)} Analisar estatísticas ${icon('right',15)}</button><button data-dt391-action="newtrade">${icon('plus',17)} Registrar operação ${icon('right',15)}</button></div>${endSection}
      ${section('spark','Insights automáticos')}<p class="dt391-muted">Observações baseadas no seu diário, não recomendações de compra ou venda.</p><div class="dt391-insight"><span>${icon('check',17)}</span><p>${cl.length?`Você concluiu ${cl.length} operações hoje; ${gains} tiveram resultado positivo.`:'Registre suas operações para começar a avaliar consistência.'}</p></div><div class="dt391-insight"><span>${icon('shield',17)}</span><p>${open.length?`Há ${open.length} posição(ões) monitorada(s). Confira os stops e o risco no Profit Pro.`:'Sem posições abertas registradas no diário.'}</p></div><div class="dt391-insight"><span>${icon('book',17)}</span><p>Avalie disciplina, contexto e aderência ao plano antes de tirar conclusões.</p></div>${endSection}</div></div>`;
  }
  function history(){
    const ts=closed().sort((a,b)=>tradeDate(a).localeCompare(tradeDate(b))),list=ts.slice(-60);
    if(list.length<2)return '<div class="dt391-chartempty">Registre ao menos dois trades encerrados para ver a curva de resultados.</div>';
    let p=0;const a=list.map(t=>(p+=result(t)||0)),minimum=Math.min(0,...a),maximum=Math.max(0,...a),span=Math.max(1,maximum-minimum);
    const pts=a.map((v,i)=>`${(i/(a.length-1)*590+5).toFixed(1)},${(180-(v-minimum)/span*155).toFixed(1)}`).join(' ');
    const zero=(180-(0-minimum)/span*155).toFixed(1);
    return `<svg class="dt391-perf-svg" role="img" aria-label="Curva acumulada de resultados de ${list.length} trades encerrados" viewBox="0 0 600 210" preserveAspectRatio="none"><g class="dt391-gridlines">${[25,65,105,145,185].map(y=>`<path d="M0 ${y}H600"/>`).join('')}</g><path class="dt391-zero" d="M0 ${zero}H600"/><polyline points="${pts}" fill="none" stroke="#f0f4fa" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><text x="592" y="15" text-anchor="end">P&L acumulado · ${fmt(p)}</text></svg>`;
  }
  function journal(){
    const ts=dayTrades(),net=sumResults(ts),w=ts.filter(t=>result(t)>0),r=ts.length?w.length/ts.length*100:null;
    return `<div class="dt391-page dt391-journal">${section('book','Resumo do dia',`<span class="dt391-datechip">${safe(currentDay().split('-').reverse().join('/'))}</span>`)}<div class="dt391-kpis"><div><small>Resultado</small><strong class="${direction(net)}">${net>0?'+':''}${fmt(net)}</strong></div><div><small>Win rate</small><strong>${r==null?'—':pc(r)}</strong></div><div><small>R acumulado</small><strong class="${direction(sumR(ts))}">${sumR(ts).toFixed(2).replace('.',',')} R</strong></div><div><small>Nº de trades</small><strong>${ts.length}</strong></div></div>${endSection}
      ${section('chart','Performance do Diário')}<div class="dt391-chart-toolbar"><span>Resultado acumulado dos últimos trades fechados</span><button data-dt391-route="stats">Análise completa ${icon('right',14)}</button></div>${history()}<small class="dt391-muted">Dados do seu diário. Comparação com o IBOV exige série histórica validada e não é simulada.</small>${endSection}
      ${section('check','Checklist e cenário',action('Abrir plano','dia'))}<p class="dt391-notes">${safe(dayData().plano||'Plano não preenchido para esta data.')}</p>${endSection}
      ${section('trade','Operações de hoje',action('Ver operações','ops'))}<div class="dt391-oplist">${ts.slice(0,10).map(operationRow).join('')||'<p class="dt391-muted">Ainda não há trades encerrados neste dia.</p>'}</div>${endSection}
      <div class="dt391-two">${section('edit','Anotações e lições')}<p class="dt391-notes">${safe(dayData().resumo||'Escreva a revisão do dia nas ferramentas completas.')}</p>${endSection}${section('target','Pontos de atenção')}<p class="dt391-notes">${safe(dayData().pre||'Registre seu ensaio mental e pontos de atenção para visualizar aqui.')}</p>${endSection}</div>
      <button class="dt391-primary" data-dt391-route="dia">${icon('book')} Registrar revisão</button></div>`;
  }
  function studies(){
    const count=Array.isArray(S?.books)?S.books.length:0;
    return `<div class="dt391-page dt391-study"><section class="dt391-study-hero"><span class="dt391-eyebrow">${icon('graduation',17)} Trilha em destaque</span><div class="dt391-study-feature"><div class="dt391-candleart" aria-hidden="true"><svg viewBox="0 0 290 145" preserveAspectRatio="none"><defs><pattern id="dt391grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" stroke="#103c36" stroke-width=".5" fill="none"/></pattern></defs><rect width="290" height="145" fill="#061e1c"/><rect width="290" height="145" fill="url(#dt391grid)"/><path d="M6 126C25 113 40 114 60 98S110 109 130 78 180 86 200 51 250 40 285 15" fill="none" stroke="#e8ae46" stroke-width="2"/>${Array.from({length:16},(_,i)=>{const x=13+i*17,p=123-i*6+Math.sin(i*1.7)*13;return `<path d="M${x} ${p-13}v26" stroke="${i%4===0?'#ec7969':'#27d4a8'}"/><rect x="${x-4}" y="${p-9}" width="8" height="18" fill="${i%4===0?'#ec7969':'#27d4a8'}"/>`}).join('')}</svg><span>${icon('play',31)}</span></div><div><h2>Análise Técnica dos Mercados Financeiros</h2><p>Estudos de gráficos, tendências, suporte, resistência e gerenciamento de risco.</p><span class="dt391-muted">Biblioteca atual: ${count} livro(s)</span><small class="dt391-muted">Progresso individual disponível nas aulas</small><button data-dt391-action="legacy">Explorar aulas e livros ${icon('right',15)}</button></div></div></section>
      <div class="dt391-study-cats"><button data-dt391-action="legacy">${icon('book',17)} Livros</button><button data-dt391-action="legacy">Aa Inglês</button><button data-dt391-action="legacy">${icon('graduation',17)} CNPI-T</button><button data-dt391-action="legacy">${icon('play',17)} Vídeos</button><button data-dt391-action="legacy">${icon('newspaper',17)} Resumos</button></div>
      ${section('clock','Continuar estudando')}<div class="dt391-reading-list">${(Array.isArray(S?.books)?S.books:[]).slice(0,4).map(b=>`<button class="dt391-reading" data-a="openbook" data-id="${safe(b.id)}"><span>${icon('book',21)}</span><span><strong>${safe(b.t||'Livro sem título')}</strong><small>${safe(b.a||'Autor não informado')} · ${(b.notes||[]).length} anotação(ões)</small></span>${icon('right',16)}</button>`).join('')||'<p class="dt391-muted">Nenhuma leitura cadastrada. Abra a biblioteca e escolha seu primeiro livro.</p>'}</div>${endSection}
      ${section('book','Biblioteca')}<div class="dt391-shortcuts"><button data-dt391-action="legacy">${icon('play')} Vídeo aula</button><button data-dt391-action="legacy">${icon('book')} Resumo de livro</button><button data-dt391-action="legacy">${icon('check')} Checklist de leitura</button><button data-dt391-action="legacy">${icon('graduation')} Simulado</button></div>${endSection}
      ${section('spark','Sugestões de estudo')}<div class="dt391-quicklist"><button data-dt391-action="legacy">${icon('chart')} Revisar juros e fluxo ${icon('right',16)}</button><button data-dt391-action="legacy">${icon('book')} Retomar material em andamento ${icon('right',16)}</button></div>${endSection}</div>`;
  }
  function market(){return `<div class="dt391-page dt391-market"><header class="dt391-feature-head"><h1>${icon('globe',23)} Mercado</h1><p>Cotações, gráficos, notícias e agenda de fontes conectadas. Escolha uma categoria abaixo.</p></header><div class="dt391-market-filters"><button data-dt391-market="cot">${icon('chart',16)} Cotações</button><button data-dt391-market="nt">${icon('newspaper',16)} Notícias</button><button data-dt391-market="ag">${icon('calendar',16)} Agenda</button><button data-dt391-market="al">${icon('bell',16)} Alertas</button></div><div class="dt391-live-note">${icon('shield',16)} Os dados exibidos abaixo vêm das fontes do aplicativo. Cotações indisponíveis não são preenchidas com exemplos.</div></div>`;}
  function terminal(){return `<div class="dt391-page dt391-terminal"><header class="dt391-feature-head"><h1>${icon('monitor',23)} Terminal de Inteligência</h1><p>Segunda tela de consulta: Radar Global, Juros, Fluxo, Notícias e gráficos. Execução de ordens permanece no Profit Pro.</p></header><div class="dt391-terminal-links"><button data-dt391-action="terminalpicker">${icon('layers')} Selecionar workspace</button><button data-dt391-route="mercado">${icon('globe')} Mercado</button><button data-dt391-route="ops">${icon('shield')} Risco</button></div></div>`;}
  function nav(){
    const items=[['home','home','Início'],['dia','calendar','Meu dia'],['ops','trade','Operações'],['mercado','chart','Mercado'],[tab==='term'?'term':'estudos',tab==='term'?'monitor':'graduation',tab==='term'?'Terminal':'Estudos']];
    const n=doc.querySelector('nav');if(!n)return;
    n.classList.add('dt391-nav');n.innerHTML=items.map(([id,ic,text])=>`<button type="button" data-tab="${id}" class="${tab===id?'on':''}">${icon(ic,25)}<span>${text}</span></button>`).join('');
  }
  function relocateOld(root){
    const existing=Array.from(root.childNodes);
    const legacy=doc.createElement('details');legacy.className='dt391-legacy';legacy.id='dt391-legacy';legacy.innerHTML='<summary>'+icon('settings',17)+' Ferramentas completas da versão anterior <span>Expandir</span></summary>';
    const old=doc.createElement('div');old.className='dt391-legacy-content';existing.forEach(n=>old.appendChild(n));legacy.appendChild(old);
    return legacy;
  }
  function decorate(){
    const root=doc.getElementById('app');if(!root||root.dataset.dt391Decorated==='1')return;
    try{
      doc.body.classList.add('dt391-active');
      const current=doc.getElementById('dt391-global-head');if(current)current.remove();
      const head=doc.createElement('div');head.id='dt391-global-head';head.innerHTML=header()+ticker();
      root.before(head);
      const enhanced=['home','dia','ops','trades','stats','estudos','mercado','term'].includes(tab);
      if(enhanced){
        let module='';
        if(tab==='home')module=home();
        else if(tab==='dia')module=day();
        else if(tab==='ops'||tab==='trades')module=operations();
        else if(tab==='stats')module=journal();
        else if(tab==='estudos')module=studies();
        else if(tab==='mercado')module=market();
        else if(tab==='term')module=terminal();
        const panel=doc.createElement('div');panel.innerHTML=module;
        if(['mercado','term'].includes(tab)){
          // Painéis de dados/gráficos mantêm seus nós originais na posição: não
          // deslocar charts, listeners, iframes nem o grid arrastável do Terminal.
          root.insertBefore(panel,root.firstChild);
        }else{
          const legacy=relocateOld(root);
          root.appendChild(panel);
          root.appendChild(legacy);
        }
      }
      nav();
      root.dataset.dt391Decorated='1';
      doc.querySelector('meta[name="theme-color"]')?.setAttribute('content','#031611');
    }catch(err){console.error('dt391: falha ao aprimorar interface; apresentação original preservada',err);}
  }
  // Delegação separada da do app: preserva os handlers nativos de data-a e data-tab.
  doc.addEventListener('click',function(e){
    const route=e.target.closest('[data-dt391-route]');
    if(route){e.preventDefault();e.stopImmediatePropagation();const r=route.dataset.dt391Route;tab=r;render();window.scrollTo?.(0,0);return;}
    const mr=e.target.closest('[data-dt391-market]');
    if(mr){e.preventDefault();e.stopImmediatePropagation();MKT.tab=mr.dataset.dt391Market;tab='mercado';render();return;}
    const ac=e.target.closest('[data-dt391-action]');if(!ac)return;
    const a=ac.dataset.dt391Action;
    if(a==='legacy'){e.preventDefault();e.stopImmediatePropagation();const d=doc.getElementById('dt391-legacy');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});}return;}
    if(a==='newtrade'){e.preventDefault();e.stopImmediatePropagation();doc.querySelector('#fab')?.click();return;}
    if(a==='search'){
      e.preventDefault();e.stopImmediatePropagation();
      const q=window.prompt('Buscar ativo, informação ou painel. Digite um termo:');if(!q)return;
      tab='mercado';MKT.tab='cot';render();doc.getElementById('dt391-legacy')?.setAttribute('open','');
      setTimeout(()=>{const text=doc.querySelector('[type="search"],#mkq,input[placeholder*="ticker" i]');if(text){text.value=q;text.dispatchEvent(new Event('input',{bubbles:true}));text.focus();}},80);
      return;
    }
    if(a==='terminalpicker'){e.preventDefault();e.stopImmediatePropagation();const picker=doc.querySelector('[data-radar-picker]');if(picker)picker.click();else doc.getElementById('dt391-legacy')?.scrollIntoView({behavior:'smooth'});return;}
    if(a==='checkphase'){e.preventDefault();e.stopImmediatePropagation();doc.querySelectorAll('[data-phase]').forEach(b=>b.classList.toggle('active',b===ac));return;}
  },true);
  // Revestir render0 (e não apenas render) cobre também atualizações automáticas dos módulos.
  if(typeof render0==='function'){
    const original=render0;
    render0=function(){
      doc.getElementById('app')?.removeAttribute('data-dt391-decorated');
      const output=original.apply(this,arguments);
      decorate();
      return output;
    };
  }else if(typeof render==='function'){
    const original=render;
    render=function(){
      doc.getElementById('app')?.removeAttribute('data-dt391-decorated');
      const output=original.apply(this,arguments);
      decorate();return output;
    };
  }
  // First render may have happened before this late-loaded progressive enhancement.
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,90),{once:true});
  else setTimeout(decorate,90);
})();
