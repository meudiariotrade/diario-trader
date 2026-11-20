/* Contrato editorial compartilhado pelo servidor, tela e PDF. Sem rede ou armazenamento. */
(function (root) {
  'use strict';
  const VERSION = 'jornal-v840';
  const clone = x => JSON.parse(JSON.stringify(x ?? null));
  const number = x => typeof x === 'number' && Number.isFinite(x);
  const text = x => String(x ?? '').trim();
  const url = x => { try { const u = new URL(text(x)); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
  const freeze = x => { if (x && typeof x === 'object' && !Object.isFrozen(x)) { Object.values(x).forEach(freeze); Object.freeze(x); } return x; };
  const brDay = iso => { const d = new Date(iso); return Number.isFinite(+d) ? d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) : ''; };
  function phase(e) {
    return e.edicao === 'meio' ? { title: 'Pregão em andamento', table: 'Cotações na coleta', next: 'O que observar no restante da sessão' }
      : e.edicao === 'tarde' ? { title: 'Balanço da sessão', table: 'Referências da edição', next: 'Preparação para o próximo pregão' }
      : e.edicao === 'fds' ? { title: 'Balanço da semana', table: 'Últimas referências disponíveis', next: 'O que observar na próxima semana' }
      : { title: 'Preparação para a abertura', table: 'Últimas referências disponíveis', next: 'O que observar no pregão' };
  }
  const isRate = q => /^di\d|^di$|^us10/.test(text(q.k));
  function quote(q, collected) {
    const rate = isRate(q), ref = text(q.referencia_em || q.updated_at);
    const k = text(q.k), px = number(q.px) ? q.px : null;
    // Não converter escalas silenciosamente: uma cotação incompatível fica indisponível.
    const badScale = (k === 'wdo' && px !== null && px < 100) || (k === 'win' && px !== null && px < 1000);
    return { ...clone(q), k, px: badScale ? null : px, d1: number(q.d1) ? q.d1 : null,
      unidade: rate ? '% a.a.' : ['win', 'ibov', 'wdo'].includes(k) ? 'pontos' : text(q.unidade) || (k === 'dolar' ? 'R$/US$' : 'unidade da fonte'),
      unidade_variacao: rate ? 'p.p.' : '%', fonte: text(q.fonte) || 'Fonte não identificada',
      simbolo: text(q.simbolo), contrato: text(q.contrato) || (/1!$/.test(text(q.simbolo)) ? 'Série contínua; vencimento não identificado' : ''),
      coletado_em: text(q.coletado_em) || collected || '', referencia_em: ref,
      referencia_tipo: text(q.referencia_tipo) || 'último disponível; fechamento/ajuste não confirmado',
      status: badScale || q.status === 'divergente' ? 'divergente' : px === null ? 'indisponivel' : !ref ? 'horario_nao_informado' : 'referenciado' };
  }
  function price(q) {
    if (!number(q?.px)) return 'Indisponível';
    const dec = q.k === 'dolar' ? 4 : q.k === 'wdo' ? 1 : isRate(q) ? 3 : q.px >= 1000 ? 0 : 2;
    return q.px.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function change(q) {
    return number(q?.d1) ? (q.d1 > 0 ? '+' : '') + q.d1.toLocaleString('pt-BR', { minimumFractionDigits: isRate(q) ? 3 : 2, maximumFractionDigits: isRate(q) ? 3 : 2 }) + (isRate(q) ? ' p.p.' : '%') : 'Indisponível';
  }
  function sources(list) {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter(x => x && url(x.url)).map(x => ({ titulo: text(x.titulo), url: url(x.url), publicado_em: text(x.publicado_em), consultado_em: text(x.consultado_em) })).filter(x => !seen.has(x.url) && seen.add(x.url)).slice(0, 30);
  }
  function fed(f) {
    // A faixa-alvo vigente precisa de confirmação independente da EFFR.
    if (!f || !f.faixa_confirmada || !url(f.fonte_url) || !f.referencia_em || !/^\d{4}-\d{2}-\d{2}$/.test(f.reuniao || '') || !Array.isArray(f.faixa) || f.faixa.length !== 2 || !f.faixa.every(number) || f.faixa[1] <= f.faixa[0]) return null;
    if (!['cme', 'proprio'].includes(f.metodo) || (f.metodo === 'proprio' && !text(f.metodologia))) return null;
    const cs = f.cenarios;
    if (!Array.isArray(cs) || !cs.length || cs.some(c => !number(c.p) || c.p < 0 || c.p > 100 || !number(c.mov) || c.mov % 25 !== 0) || Math.abs(cs.reduce((a,c) => a+c.p,0)-100) > .2) return null;
    return clone(f);
  }
  function levels(ses, q, edition) {
    if (!ses || ses.proxy || !ses.completa || !ses.dia || !ses.contrato || !ses.fonte || !ses.referencia_em || !q?.contrato || q.contrato !== ses.contrato || ![ses.H,ses.L,ses.C].every(number) || ses.H < ses.L || ses.C > ses.H || ses.C < ses.L || edition.edicao === 'meio') return null;
    const step = q.k === 'win' ? 5 : .5, P = (ses.H+ses.L+ses.C)/3, range = ses.H-ses.L;
    const round = v => +(Math.round(v/step)*step).toFixed(q.k === 'win' ? 0 : 1);
    return { tk:q.k.toUpperCase(), contrato:ses.contrato, dia:ses.dia, fonte:ses.fonte, referencia_em:ses.referencia_em, H:ses.H,L:ses.L,C:ses.C,P:round(P),R1:round(2*P-ses.L),R2:round(P+range),S1:round(2*P-ses.H),S2:round(P-range), passo:step };
  }
  function chart(g, q) {
    if (!g || g.proxy || !g.fonte || !g.contrato || !q?.contrato || g.contrato !== q.contrato || !g.dia || !Array.isArray(g.d)) return null;
    const d = g.d.filter(c => Array.isArray(c) && c.slice(0,5).length === 5 && c.slice(0,5).every(number) && brDay(c[0]*1000) === g.dia && c[2]>=Math.max(c[1],c[4]) && c[3]<=Math.min(c[1],c[4]));
    if (d.length < 5) return null;
    return { ...clone(g), d, parcial:true };
  }
  /* v840: painel técnico (índices EUA e criptos) — só números finitos e série curta. */
  function tecnico(t) {
    const itens=(Array.isArray(t?.itens)?t.itens:[]).filter(x=>x&&number(x.px)&&x.px>0&&/^[\^A-Z0-9.=-]{1,12}$/.test(text(x.sym))).slice(0,8)
      .map(x=>({sym:text(x.sym),nome:text(x.nome).slice(0,30),tipo:x.tipo==='cripto'?'cripto':'indice',px:x.px,d1:number(x.d1)?x.d1:null,rsi14:number(x.rsi14)?x.rsi14:null,
        sma20:number(x.sma20)?x.sma20:null,sma50:number(x.sma50)?x.sma50:null,sma200:number(x.sma200)?x.sma200:null,dist20:number(x.dist20)?x.dist20:null,dist200:number(x.dist200)?x.dist200:null,
        ret1m:number(x.ret1m)?x.ret1m:null,ret3m:number(x.ret3m)?x.ret3m:null,max52:number(x.max52)?x.max52:null,min52:number(x.min52)?x.min52:null,
        tendencia:['Alta','Baixa','Lateral'].includes(x.tendencia)?x.tendencia:'Lateral',dia:text(x.dia).slice(0,10),serie:(Array.isArray(x.serie)?x.serie:[]).filter(number).slice(-60)}));
    return {itens,coletado_em:text(t?.coletado_em),fonte:text(t?.fonte)};
  }
  function snapshot(e, market = {}) {
    if (e.snapshot?.versao === VERSION) return freeze(clone(e.snapshot));
    const collected = text(e.dados_coletados_em), quotes = (e.cotacoes || []).map(q => quote(q,collected));
    for(const q of quotes) { if(q.dia_referencia && q.dia_referencia>e.dia){q.px=null;q.d1=null;q.status='divergente';q.observacao='Referência posterior à data da edição.';} else if(q.dia_referencia && Date.parse(e.dia)-Date.parse(q.dia_referencia)>7*86400000){q.status='antigo';q.observacao='Referência com mais de sete dias; não tratar como atual.';} }
    const data = { versao:VERSION, dia:e.dia, edicao:e.edicao, coletado_em:collected, cotacoes:quotes,
      sessoes:clone(market.sessoes || {}), graficos:{}, niveis:{}, movers:{altas:[],baixas:[]}, macro:clone(market.macro || {}), fed:fed(market.fed), tecnico:tecnico(market.tecnico) };
    for (const k of ['win','wdo']) {
      const q = quotes.find(q=>q.k===k);
      data.niveis[k] = levels(data.sessoes[k],q,e);
      data.graficos[k] = chart(market.graficos?.[k],q);
    }
    // Ranking sem data de referência não é misturado a uma edição histórica.
    if (market.movers?.dia === e.dia && market.movers?.referencia_em) data.movers = clone(market.movers);
    // Conteúdo integral identifica snapshots mesmo se duas gerações ocorrerem no mesmo horário.
    let hash=2166136261; for(const c of JSON.stringify(data)) hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
    data.id=`${e.dia}:${e.edicao}:${hash.toString(16)}`;
    return freeze(data);
  }
  function agenda(list, edition={}) {
    return (Array.isArray(list)?list:[]).filter(a=>a && text(a.evento) && !/divulga[cç][aã]o de indicadores econ[oô]micos|monitoramento da trajet[oó]ria/i.test(a.evento) && url(a.fonte_url) && /^\d{4}-\d{2}-\d{2}$/.test(a.data || '') && a.pais && Number.isFinite(Date.parse(a.data+'T12:00:00Z')) && new Date(a.data+'T12:00:00Z').toISOString().slice(0,10)===a.data && (!a.horario || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(a.horario)) && (!edition.dia || a.data>=edition.dia) && (!edition.gerado || !a.horario || a.realizado || Date.parse(a.data+'T'+a.horario+':00-03:00')>=Date.parse(edition.gerado))).map(a=>({...clone(a), fonte_url:url(a.fonte_url), horario:text(a.horario), quando:a.data+(a.horario?' '+a.horario+' Brasília':' · horário não confirmado')}));
  }
  function inspect(e, snap) {
    const problems=[], fixes=[], gaps=[...(e.agenda_lacunas||[])], texts=[e.manchete,...(e.materias||[])].filter(Boolean);
    if(e.verificacao_fontes) gaps.push(e.verificacao_fontes);
    if(e.pesquisa_web_parcial) gaps.push('Pesquisa web disponível apenas em parte da edição; demais textos usam os dados recebidos.');
    else if(e.pesquisa_web===false) gaps.push('Pesquisa web não disponível nesta geração; análise limitada aos dados e resumos recebidos.');
    for(const q of snap.cotacoes) {
      if(q.status==='antigo') gaps.push(`${q.n||q.k}: referência antiga; consultar data da sessão.`);
      if(q.status==='divergente') problems.push(`${q.n||q.k}: escala incompatível; valor omitido.`);
      if(!q.referencia_em && !gaps.includes('Horário do negócio não informado para parte das cotações; confira a rastreabilidade dos dados.')) gaps.push('Horário do negócio não informado para parte das cotações; confira a rastreabilidade dos dados.');
      if(q.px===null) gaps.push(`${q.n||q.k}: cotação indisponível.`);
    }
    const vals = [...snap.cotacoes,...(snap.movers.altas||[]).map(x=>({k:x.tk,n:x.tk,d1:x.var})),...(snap.movers.baixas||[]).map(x=>({k:x.tk,n:x.tk,d1:x.var}))];
    const blocked = new Set();
    texts.forEach((m,index)=>{
      if(m.revisao){problems.push(m.titulo+': '+m.revisao);blocked.add(index);}
      const txt=[m.titulo,m.linha_fina,m.texto,m.por_que_importa,...(m.numeros||[]).map(n=>n.rotulo+' '+n.valor)].join('\n');
      for(const q of vals) {
        const aliases=q.k==='ibov'?['Ibovespa','IBOV']:q.k==='win'?['WIN','mini índice']:q.k==='wdo'?['WDO','dólar futuro']:q.k==='dolar'?['dólar à vista','dólar comercial']:/^[A-Z]{4}\d/.test(q.k)?[q.k]:[];
        for(const alias of aliases) {
          const escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
          const re=new RegExp('\\b'+escaped+'\\b[^.!?;\\n%]{0,75}?([+−-]?\\d+(?:[,.]\\d+)?)\\s*%','gi');
          if(number(q.px)) {
            const priceRe=new RegExp('\\b'+escaped+'\\b[^!?;\\n]{0,100}?\\b(?:aos|cotad[oa](?: a| em)?|negociad[oa](?: a| em)?)\\s*(?:R\\$\\s*)?([\\d.]+(?:,\\d+)?)','gi');
            for(const h of txt.matchAll(priceRe)) { const raw=h[1],v=Number(raw.replace(/\./g,'').replace(',','.')),dec=raw.includes(',')?raw.split(',')[1].length:0;
              if(number(v)&&Math.abs(v-q.px)>Math.max(.0001,.51*10**-dec)) { fixes.push({index,alias,de:raw,para:price(q),tipo:'preco'}); }
            }
          }
          for(const hit of txt.matchAll(re)) {
            let n=Number(hit[1].replace(',','.').replace('−','-'));
            if(n>0 && /queda|recu|cai|baixa|despenc|perd/i.test(hit[0])) n=-n;
            if(number(q.d1) && Math.abs(n-q.d1)>.055) { fixes.push({index,alias,de:hit[1],para:change(q).replace(/^[+−-]/,'').replace(/%$/,''),tipo:'variacao',sinal:q.d1<0?'-':'+',trecho:hit[0]}); }
          }
        }
      }
      for(const metric of m.numeros||[]) {
        const label=text(metric.rotulo).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        const q=snap.cotacoes.find(q=>q.k==='ibov'?label==='ibovespa':q.k==='win'?/^(mini indice|win)$/.test(label):q.k==='wdo'?/^(dolar futuro|wdo)$/.test(label):q.k==='dolar'?/^(dolar comercial|dolar a vista)$/.test(label):false);
        if(!q||!number(q.px))continue;
        const token=text(metric.valor).match(/[+−-]?\d[\d.,]*/)?.[0];if(!token)continue;
        const raw=token.includes(',')?token.replace(/\./g,'').replace(',','.'):token.replace(/\.(?=\d{3}(?:\D|$))/g,'');
        const value=Number(raw),dec=token.includes(',')?token.split(',')[1].length:0;
        if(number(value)&&Math.abs(value-q.px)>Math.max(.0001,.51*10**-dec)) { metric.valor=text(metric.valor).replace(token,price(q)); gaps.push((q.n||q.k)+': número do card ajustado ao último dado da edição.'); }
      }
      if(!blocked.has(index) && !url(m.fonte_url) && !(m.fontes||[]).some(f=>url(typeof f==='string'?f:f.url))) gaps.push(`${m.titulo}: fonte específica não vinculada.`);
    });
    if(!snap.fed) gaps.push('FedWatch omitido: faixa-alvo, metodologia ou referência não confirmadas.');
    if(!Object.values(snap.niveis).some(Boolean)) gaps.push('Pivôs indisponíveis: falta sessão completa do contrato; proxies à vista não são usados.');
    /* v840: número divergente é corrigido para o dado da edição em vez de reter a matéria inteira
       (antes, um único número derrubava o texto e o Jornal encolhia). Só "revisao" explícita ainda retém. */
    for(const f of fixes){const m=texts[f.index];if(!m)continue;
      for(const campo of ['titulo','linha_fina','texto','por_que_importa']){
        if(typeof m[campo]!=='string')continue;
        if(f.tipo==='variacao'&&f.trecho){const novo=f.trecho.replace(f.de,f.para);m[campo]=m[campo].split(f.trecho).join(novo);}
        else{const re=new RegExp('(\\b'+f.alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b[^!?;\\n]{0,100}?)'+f.de.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');m[campo]=m[campo].replace(re,'$1'+f.para);}
      }
      gaps.push(`${f.alias}: número citado ajustado ao último dado da edição.`);
    }
    return { versao:VERSION, estado:problems.length?'revisar':'com_limitacoes', problemas:[...new Set(problems)], lacunas:[...new Set(gaps)], artigos_bloqueados:[...blocked], ajustes:fixes.length };
  }
  function prepare(input, market={}) {
    if(input.editorial_versao===VERSION && input.snapshot?.versao===VERSION) return clone(input);
    const e=clone(input), snap=snapshot(e,market), review=inspect(e,snap);
    e.editorial_versao=VERSION;
    e.snapshot=snap; e.cotacoes=snap.cotacoes; e.qualidade=review;
    const old=[e.manchete,...(e.materias||[])];
    for(const i of review.artigos_bloqueados) {
      const m=old[i]; if(m) old[i]={...m,titulo:'Conteúdo retido para revisão de consistência',linha_fina:'A evidência desta matéria requer conferência.',texto:'Consulte o painel de referências e as fontes vinculadas. O texto foi retido porque a evidência ou os números não passaram pela conferência.',numeros:[],impacto:{ativos:[],setores:[],direcao:''},por_que_importa:'',placar:'',consenso:'',fato:'',interpretacao:'',cenario:''};
    }
    e.manchete=old[0]; e.materias=old.slice(1);
    // Uma divergência em UMA matéria não deve destruir TODAS as editorias do jornal.
    // Filtra cada bloco independente contra o mesmo snapshot; mantém a edição extensa
    // quando o texto sobrevivente é coerente. O artigo divergente segue retido acima.
    if (review.problemas.length) {
      const trechoSeguro = t => {
        const x=text(t);
        if (!x) return false;
        const v=inspect({manchete:{titulo:'Conferência de bloco',texto:x},materias:[]},snap);
        return !v.artigos_bloqueados.length;
      };
      if(e.analise && !trechoSeguro([e.analise.titulo,e.analise.texto].join(' ')))e.analise=null;
      if(e.mesa && !trechoSeguro(JSON.stringify(e.mesa)))e.mesa=null;
      e.em_poucas_linhas=(Array.isArray(e.em_poucas_linhas)?e.em_poucas_linhas:[]).filter(trechoSeguro).slice(0,8);
      e.cinco_coisas=(Array.isArray(e.cinco_coisas)?e.cinco_coisas:[]).filter(x=>x&&trechoSeguro([x.titulo,x.texto].join(' '))).slice(0,5);
      if(!trechoSeguro(e.fechamento_texto))e.fechamento_texto='';
      if(e.grafico_do_dia && !snap.graficos?.win && !snap.graficos?.wdo)e.grafico_do_dia=null;
    }
    for(const m of [e.manchete,...e.materias].filter(Boolean)) {
      if(!m.consenso_valor || !url(m.consenso_fonte) || !m.periodo) { m.placar=''; m.consenso=''; }
      m.fonte_url=url(m.fonte_url); m.fontes=sources((m.fontes||[]).map(f=>typeof f==='string'?{url:f}:f));
      // Uma direção única para vários ativos não descreve relações opostas.
      if((m.impacto?.ativos||[]).length>1) m.impacto.direcao='misto';
    }
    const originalAgenda=e.agenda||[]; e.agenda=agenda(originalAgenda,e);
    if(originalAgenda.length!==e.agenda.length) review.lacunas.push('Itens de agenda sem data, país ou fonte foram omitidos.');
    e.fontes=sources([...(e.fontes||[]),...[e.manchete,...e.materias].flatMap(m=>m?[{titulo:m.titulo,url:m.fonte_url},...(m.fontes||[])]:[]),...e.agenda.map(a=>({titulo:a.evento,url:a.fonte_url}))]);
    return e;
  }
  /** Suplemento privado: não altera a referência pública nem assume contrato pelo mês. */
  function profit(rows,edition,collected=new Date().toISOString()) {
    const cotacoes=[],lacunas=[];
    for(const root of ['WIN','WDO']) {
      const matches=(Array.isArray(rows)?rows:[]).filter(x=>String(x.ticker||'').startsWith(root));
      const candidates=matches.filter(x=>new RegExp('^'+root+'[FGHJKMNQUVXZ](?:\\d{2}|\\d{4})$').test(text(x.contrato||x.ticker)));
      if(candidates.length!==1){lacunas.push(root+': contrato específico ausente ou ambíguo na ponte.');continue;}
      const r=candidates[0],contract=text(r.contrato||r.ticker),raw=text(r.dat),d=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),day=d?`${d[3]}-${d[2]}-${d[1]}`:raw;
      const time=text(r.hor),ref=/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)&&/^\d{4}-\d{2}-\d{2}$/.test(day)?day+'T'+time+'-03:00':'';
      const numeric=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
      const px=numeric(r.ult),step=root==='WIN'?5:.5;
      if(!ref||brDay(ref)!==day||day!==edition.dia||Date.parse(ref)>Date.parse(collected)+60000||!px||Math.abs(px/step-Math.round(px/step))>1e-6){lacunas.push(root+': preço, data ou horário do negócio incompatível com a edição.');continue;}
      const H=numeric(r.max),L=numeric(r.min),O=numeric(r.abe),ohlc=[H,L,O,px].every(x=>number(x)&&x>0&&Math.abs(x/step-Math.round(x/step))<1e-6)&&H>=Math.max(O,px)&&L<=Math.min(O,px)?{O,H,L,C:px}:null;
      cotacoes.push({...quote({k:root.toLowerCase(),n:root,px,d1:numeric(r.var),contrato:contract,simbolo:contract,fonte:'Profit / ponte privada',referencia_em:ref,referencia_tipo:'último negócio informado pela ponte; não é ajuste oficial'},collected),ohlc,sessao_completa:!!ohlc&&r.sessao_completa===true});
      if(!ohlc)lacunas.push(root+': OHLC completo indisponível na ponte.');
    }
    return freeze({cotacoes,lacunas,coletado_em:collected,nota:'Suplemento privado capturado sob solicitação; não substitui o snapshot editorial. FEC da ponte não é tratado como ajuste oficial.'});
  }
  root.DiarioJornalQualidade=Object.freeze({VERSION,freeze,clone,url,phase,quote,price,change,sources,fed,levels,chart,snapshot,inspect,prepare,profit});
})(globalThis);
