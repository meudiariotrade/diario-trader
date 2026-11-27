/* v807: Inteligência contextual nas telas existentes; sem abas, timers ou dados privados no Worker. */
(function (w) {
  'use strict';
  if (w.DiarioInteligenciaEtapa1) return;
  const URL_BASE = 'https://diario-trader.lucianosilva43567.workers.dev';
  const state = { eventos: null, mercado: null, newsAt: 0, marketAt: 0, loadingNews: false, loadingMarket: false, route: '', abort: null, fluxo: null, flowAt: 0, flowBusy: false, memoria: null, boundary: null, sessionKey: '', analogia: null, analogiaAt: 0, analogiaBusy: false, extras: null, extrasAt: 0, extrasBusy: false, agenda: null, agendaAt: 0, agendaBusy: false, edicaoManual: '', revisaoBusy: false, revisaoOut: '', resumaoBusy:false, resumaoHtml:'', resumaoEd:'' };
  const escape = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  /* v927: formatação editorial limpa (títulos dourados, negrito real, leitura confortável 14.5px). */
  function formatarTextoEditorial(raw){
    const safe=escape(String(raw||'').slice(0,7500)).replace(/\r/g,'').trim();
    if(!safe)return '';
    const md=s=>s.replace(/\*\*([^*]{1,120})\*\*/g,'<strong style="color:inherit;font-weight:700">$1</strong>');
    const paras=safe.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
    return paras.map(p=>{
      const m=/^(\d+\)\s*[^:\n]{2,72})(?::\s*|\n)([\s\S]*)$/.exec(p);
      if(m){
        const titulo=m[1].replace(/\*\*/g,'').trim();
        const corpo=md(m[2].trim()).replace(/\n/g,'<br>');
        return '<div style="margin:0 0 12px;padding:9px 12px;border-left:2px solid rgba(201,166,107,.65);background:rgba(201,166,107,.05);border-radius:0 8px 8px 0">'+
          '<div style="font-weight:700;font-size:13.5px;letter-spacing:.01em;color:var(--gold,#C9A66B);margin-bottom:4px">'+titulo+'</div>'+
          '<div style="font-size:14.5px;line-height:1.65">'+corpo+'</div></div>';
      }
      if(/^(?:[-•*]\s+)/m.test(p)){
        const itens=p.split('\n').map(l=>l.replace(/^[-•*]\s+/,'').trim()).filter(Boolean);
        return '<ul style="margin:0 0 10px;padding-left:18px;font-size:14.5px;line-height:1.65">'+itens.map(i=>'<li style="margin-bottom:4px">'+md(i)+'</li>').join('')+'</ul>';
      }
      return '<p style="margin:0 0 10px;font-size:14.5px;line-height:1.65">'+md(p).replace(/\n/g,'<br>')+'</p>';
    }).join('');
  }
  function contextoPessoalIA950(promptTexto) {
    const bits = [];
    try {
      const mf = w.DiarioMacroFiscal?.();
      const n=v=>v==null||v===''?NaN:Number(v);
      const selic = n(mf?.brasil?.selic_meta?.valor), ipca = n(mf?.brasil?.ipca_12m?.valor);
      if (Number.isFinite(selic)) bits.push('Selic ' + selic.toFixed(2).replace('.', ',') + '% a.a.' + (Number.isFinite(ipca) ? ' · IPCA 12m ' + ipca.toFixed(2).replace('.', ',') + '%' : ''));
    } catch {}
    try {
      // Só percentuais agregados da carteira calculada em BRL; nunca nomes, saldos, notas, tokens ou histórico.
      const tkMatch=/\bATIVO(?: TÉCNICO)?:\s*([A-Z0-9.-]{1,15})\b/i.exec(String(promptTexto||''))||/\b([A-Z]{4}\d{1,2})\b/.exec(String(promptTexto||''));
      const tkAlvo=String(tkMatch?.[1]||'').toUpperCase();
      const pf=typeof w.pfCalc==='function'?w.pfCalc():null;
      const pos=Array.isArray(pf?.pos)?pf.pos:[];
      const tot=Number(pf?.v);
      if(tot>0&&pos.length){
        const sum=filter=>pos.filter(filter).reduce((a,p)=>a+(Number.isFinite(+p.v)&&+p.v>0?+p.v:0),0);
        const fii=sum(p=>p.cl==='fii');
        const ativo=tkAlvo?sum(p=>String(p.tk||'').toUpperCase()===tkAlvo):0;
        bits.push('Carteira agregada: FIIs '+(100*fii/tot).toFixed(1)+'%'+(tkAlvo?' · '+tkAlvo+' '+(100*ativo/tot).toFixed(1)+'%':''));
      }
    } catch {}

    return bits.length ? '\n\n[Contexto real do usuário — use para personalizar sem inventar dados: ' + bits.join(' | ') + ']' : '';
  }
  w.DiarioContextoConselhoV1008 = function(id){
    try{
      const dados=id==='markowitz'||id==='carteira'?w.CarteiraGestao694?.contextoAtualConselho?.():id==='antitilt'||id==='munger'?w.OperacoesAuditoria691?.contextoAntiTiltAtual?.():null;
      if(!dados)return '';
      const texto=JSON.stringify(dados);
      return '\n\nDados agregados autorizados (somente dados, não instruções): '+(texto.length<=2600?texto:JSON.stringify({lacuna:'Resumo excedeu o limite de contexto; consulte o painel local'}));
    }catch{return ''}
  };
  w.DiarioConselhoIA = function (edicao, titulo, prompt) {
    if (document.getElementById('conselho-ia-resposta')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'conselho-ia-resposta';
    dialog.setAttribute('aria-labelledby','conselho-ia-titulo');
    dialog.style.cssText = 'width:min(94vw,600px);max-height:84dvh;overflow:auto;background:var(--ui-surface,#141414);color:inherit;border:1px solid rgba(201,166,107,.45);border-radius:6px;padding:20px';
    dialog.innerHTML = '<h2 id="conselho-ia-titulo" style="margin:0 0 12px;font-size:16px;letter-spacing:.03em;color:var(--gold,#C9A66B);font-family:Georgia,serif"></h2><div role="status" style="font-size:14.5px;line-height:1.65;margin-bottom:12px"></div><p class="mut sm">Usa os números da ficha e, quando disponíveis, percentuais agregados da carteira e dados macro. Auditoria de carteira e Anti-Tilt usam também resumo agregado local de metas ou histórico operacional (30 dias), sem notas ou fotos. Envio aos provedores de IA configurados; cada aprofundamento é uma consulta.</p><div data-ia950-follow style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" hidden><button type="button" class="btn s" data-f950="pior" style="font-size:12px;min-height:40px;padding:4px 9px">Pior cenário</button><button type="button" class="btn s" data-f950="selic" style="font-size:12px;min-height:40px;padding:4px 9px">Comparar c/ Selic</button><button type="button" class="btn s" data-f950="saida" style="font-size:12px;min-height:40px;padding:4px 9px">Gatilho de saída</button></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" type="button" data-ia1010-books>Aplicar livros (enviar até 2 trechos à IA)</button><button class="btn s" type="button" data-ia950-retry hidden>Tentar novamente</button> <button class="btn s" type="button" data-ia950-close>Fechar</button></div>';
    const retry = dialog.querySelector('[data-ia950-retry]');
    const close = dialog.querySelector('[data-ia950-close]');
    const followBar = dialog.querySelector('[data-ia950-follow]');
    const output = dialog.querySelector('[role="status"]');
    dialog.querySelector('h2').textContent = titulo;
    let controller = new AbortController();
    let ultimaResposta = '', ultimoPrompt='';
    const uidInicial=typeof SESS!=='undefined'?SESS?.uid:null;
    const mesmaConta=()=>!!uidInicial&&typeof SESS!=='undefined'&&SESS?.uid===uidInicial;
    const agregado=['carteira','markowitz','antitilt'].includes(edicao)?w.DiarioContextoConselhoV1008(edicao):'';
    const promptBase = (String(prompt || '').slice(0,Math.max(800,5400-agregado.length)) + agregado + contextoPessoalIA950(prompt)).slice(0, 5800);
    let livrosAtivos=false;
    async function consultar(promptEnviar) {
      controller.abort();
      controller = new AbortController();
      const ac=controller; ultimoPrompt=promptEnviar;
      const livrosBtn=dialog.querySelector('[data-ia1010-books]');livrosBtn.disabled=true;
      retry.hidden = true;
      followBar.hidden = true; followBar.style.display='none';
      output.innerHTML = '<p class="mut" style="margin:0;font-size:14px">Analisando seus dados…</p>';
      const timer = setTimeout(()=>ac.abort(),65000);
      try {
        if(typeof tok==='function') await tok();
        const sessao=typeof SESS!=='undefined'?SESS:null;
        const jwt=sessao?.at;
        if(!mesmaConta())throw Error('Entre na conta ou reabra a análise após mudar de conta.');
        if(ac.signal.aborted)return;
        if(!jwt) throw Error('Entre na conta para acessar a análise.');
        let promptFinal=promptEnviar;
        if(livrosAtivos){
          const id=edicao==='ativo'?(/ATIVO TÉCNICO|parecer técnico|setup técnico/i.test(prompt)?'livermore':'graham'):edicao==='carteira'?'markowitz':edicao;
          let refs=[];try{refs=await w.DiarioCerebroIA?.contextoConselho?.(id,String(prompt||''),true,ac.signal)||[]}catch{}
          if(ac.signal.aborted||!mesmaConta()||!dialog.isConnected)return;
          const bloco=w.DiarioCerebroIA?.blocoConselho?.(refs)||'';
          if(bloco)promptFinal=promptEnviar.slice(0,5800-bloco.length)+bloco;
          livrosBtn.textContent=refs.length?'Livros aplicados · '+refs.length+' trechos':'Sem trechos relevantes neste aparelho';
        }
        const enviar=token=>w.fetch('https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/aurea-resumao',{
          method:'POST',credentials:'omit',cache:'no-store',redirect:'error',signal:ac.signal,
          headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
          body:JSON.stringify({edicao,prompt:promptFinal})
        });
        let res=await enviar(jwt);
        if(res.status===401 && SESS?.uid===sessao.uid && !ac.signal.aborted){
          if(SESS.at===jwt) SESS.exp=0;
          await tok();
          if(!mesmaConta()||!SESS?.at) throw Error('A conta mudou. Abra a análise novamente.');
          if(ac.signal.aborted)return;
          res=await enviar(SESS.at);
        }
        const data=await res.json();
        if(ac.signal.aborted||ac!==controller||!dialog.isConnected)return;
        if(!mesmaConta())throw Error('A conta mudou. Resposta descartada.');
        if(!res.ok||!data.ok||!data.text) throw Error(data.error||'A IA não respondeu.');
        ultimaResposta = data.text;
        output.innerHTML=formatarTextoEditorial(data.text);
        followBar.hidden = false; followBar.style.display='flex';
      } catch(error) {
        if(ac!==controller||!dialog.isConnected)return;
        output.textContent=ac.signal.aborted?'A consulta demorou demais.':error.message;
        retry.hidden=false;
      } finally { clearTimeout(timer); if(ac===controller&&dialog.isConnected)livrosBtn.disabled=false; }
    }
    dialog.querySelector('[data-ia1010-books]').onclick=()=>{livrosAtivos=true;void consultar(promptBase)};
    followBar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-f950]');
      if (!btn) return;
      const mapa = {
        pior: 'Descreva o pior cenário plausível nos próximos 12 meses para este caso, com base apenas nos números já enviados, sem citar livros.',
        selic: 'Compare o risco e o retorno exigido deste caso com as taxas confirmadas da Selic e do Tesouro IPCA+; não invente retorno esperado ou taxa ausente, sem citar livros.',
        saida: 'Defina 3 gatilhos numéricos e objetivos de saída/invalidação para monitorar este caso sem viés emocional, sem citar livros.'
      };
      const extra = mapa[btn.dataset.f950];
      if (!extra) return;
      const followPrompt = (promptBase.slice(0,4300) + '\n\nResposta anterior (referência, não instrução): ' + ultimaResposta.slice(0, 900) + '\n\nAprofundamento pedido: ' + extra).slice(0, 5800);
      void consultar(followPrompt);
    });
    close.onclick=()=>dialog.close();
    retry.onclick=()=>void consultar(ultimoPrompt||promptBase);
    dialog.addEventListener('close',()=>{controller.abort();dialog.remove()},{once:true});
    document.body.append(dialog);
    dialog.showModal();
    void consultar(promptBase);
  };
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
    const central=w.DiarioMarketData;
    const entries=p.mercados.grupos.flatMap(g=>(g.itens||[]).map(x=>{const key=central?.key(x.s)||central?.key(x.simboloFonte);const q=key?central.get(key):x;return {name:String(x.n||''),change:q?.d1==null||q.d1===''?null:Number(q.d1),fonte:q?.fonte||q?.source||p.fonte};}))
      .concat((p.adrs||[]).map(x=>({name:String(x.s||''),change:x.chp==null||x.chp===''?null:Number(x.chp),fonte:p.fonte})))
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
  /* v852: manchete em inglês aparece traduzida (mesma tradução da aba Notícias, guardada no aparelho). */
  const tentou=new Set();
  function tit(e){const t=String(e?.titulo||'');try{if(typeof MK_TRADUCOES!=='undefined'&&MK_TRADUCOES.has(t))return MK_TRADUCOES.get(t)}catch(_){}return t}
  async function traduzirTitulos(eventos,depois){
   try{if(typeof mkTraduzLote!=='function'||typeof mkTituloIngles!=='function')return;
    const itens=eventos.map(e=>({t:String(e.titulo||''),a:String((e.fontes||[]).at(-1)?.nome||'')})).filter(n=>n.t&&!tentou.has(n.t)&&mkTituloIngles(n));
    if(!itens.length)return;itens.forEach(n=>tentou.add(n.t));
    await mkTraduzLote(itens);depois&&depois();
   }catch(_){}
  }
  function rowsEvent(events,limit=5) {
    if(!events.length)return '<p class="mut sm">Nenhum acontecimento confirmado nas fontes atualmente carregadas.</p>';
    /* v833: notícia importante já vem com o estudo aberto; as demais ficam numa linha, sem botões. */
    return events.slice(0,limit).map(e=>{
      const first=(e.fontes||[]).at(-1);
      const source=first&&/^https:\/\//.test(first.url) ? '<a href="'+escape(first.url)+'" target="_blank" rel="noopener noreferrer">'+escape(first.nome||'Fonte')+'</a>' : escape(first?.nome||'Fonte indisponível');
      const imp=importante(e);
      return '<div class="i833-row'+(imp?' imp':'')+'">'+(imp?tag(oficial(e)?'fato':'publicada'):'')+sentTag(e)+'<b>'+escape(tit(e))+'</b>'+
        '<div class="mut sm">'+when(e.ultimaAtualizacao)+' · '+source+((e.quantidadeFontes||e.fontes?.length||0)>1?' · '+(e.quantidadeFontes||e.fontes.length)+' fontes':'')+'</div>'+
        (imp?estudo(e):'')+'</div>';
    }).join('');
  }
  function transmissao(e) {
    const titulo=String(e?.titulo||'').toLowerCase();
    if(e?.tema==='petroleo')return 'Petróleo → Petrobras e setor de energia → Ibovespa/WIN';
    if(e?.tema==='minerio')return 'Minério de ferro → Vale e siderurgia → Ibovespa/WIN';
    const cpiNaoEua=/\b(austr[aá]li\w*|nova zel[aâ]ndi\w*|new zealand|reino unido|\buk\b|brit[aâ]nic\w*|jap[aã]o|japan|canad[aá]|canadian|su[ií][cç]a|swiss|zona do euro|eurozone|alemanha|fran[cç]a|it[aá]lia|[ií]ndia|turquia|argentina|m[eé]xico|coreia|korea)\b/i.test(titulo)&&!/\b(eua|\busa?\b|fed\b|fomc|powell|treasur|brasil|ipca|copom|selic)\b/i.test(titulo);
    if(e?.tema==='politica_economica'){
      if(!cpiNaoEua&&/cpi|payroll|fed|fomc|treasur/.test(titulo))return 'Indicador EUA → Treasuries → dólar global → USD/BRL/WDO e Ibovespa/WIN';
      if(/ipca|copom|selic/.test(titulo))return 'Indicador Brasil → curva DI → câmbio → empresas e WIN/WDO';
    }
    return 'Evento → expectativas e prêmio de risco → preços de mercado (hipótese sem causalidade demonstrada)';
  }

  /* v833: ligação notícia → ativo com o motivo, em linguagem simples. Regras fixas (sem IA, sem custo). */
  const LIGA=[
    [/min[eé]rio|iron ore|vale\b|vale3|vale s\.?a/i,'VALE3','A Vale vive da venda de minério de ferro: preço e demanda do minério mexem direto no resultado dela.'],
    [/petr[oó]leo|brent|wti|\bopep|\bopec|petrobras|petr4|\boil\b|crude/i,'PETR4','A Petrobras vende petróleo e derivados: o preço do barril e decisões da empresa mudam receita e dividendos.'],
    [/sider|a[cç]o\b|steel|gerdau/i,'GGBR4','Gerdau é siderúrgica: preço do aço, minério e tarifas de importação afetam a margem.'],
    [/selic|copom|juros futuros|\bdi\b|ipca|infla[cç][aã]o brasileira/i,'ITUB4','Bancos e varejo reagem a juros: Selic e inflação mudam crédito, inadimplência e custo de capital.'],
    [/d[oó]lar|c[aâ]mbio|usd\/?brl|real brasileiro/i,'SUZB3','Suzano exporta celulose em dólar: câmbio mais alto aumenta a receita em reais.'],
    [/\bfed\b|\bfomc\b|powell|warsh|treasur|payroll|\b(?:us|eua)\s+cpi\b|\bcpi\s+(?:dos\s+eua|eua|americano)\b/i,'WIN','Juros americanos mexem no dólar global e no apetite por emergentes, e isso chega ao índice futuro (WIN) e ao dólar (WDO).'],
    [/banco do brasil|bbas3/i,'BBAS3','Notícia sobre o Banco do Brasil afeta diretamente a ação.'],
    [/ita[uú]|itub4/i,'ITUB4','Notícia sobre o Itaú afeta diretamente a ação.'],
    [/eletrobras|elet3/i,'ELET3','Notícia sobre a Eletrobras afeta diretamente a ação.'],
    [/ambev|abev3/i,'ABEV3','Notícia sobre a Ambev afeta diretamente a ação.'],
    [/\bweg\b|wege3/i,'WEGE3','Notícia sobre a WEG afeta diretamente a ação.'],
    [/bitcoin|cripto|crypto|\bbtc\b|ether/i,'BTC','Cripto costuma andar junto com o apetite a risco: queda forte em cripto sinaliza aversão a risco.']
  ];
  /* v852: "cita diretamente" só quando o título cita o ativo; índice, dólar e DI aparecem como hipótese explicada. */
  const HIP={
    WIN:{geopolitica:'Hipótese: tensão geopolítica costuma aumentar a aversão a risco; emergentes e o índice futuro (WIN) tendem a sofrer.',
      petroleo:'Hipótese: o petróleo pesa no Ibovespa via Petrobras, que tem grande peso no índice futuro (WIN).',
      minerio:'Hipótese: o minério pesa no Ibovespa via Vale, que tem grande peso no índice futuro (WIN).',
      politica_economica:'Hipótese: notícia macro mexe nas expectativas de juros e de risco; o efeito no índice futuro (WIN) é indireto, não garantido.'},
    WDO:{geopolitica:'Hipótese: em momentos de tensão o investidor busca dólar, o que pressiona o dólar futuro (WDO) para cima.',
      _:'Hipótese: juros e inflação mudam o diferencial de juros entre Brasil e EUA, o que mexe no dólar futuro (WDO).'},
    DI:{_:'Hipótese: Copom e inflação mudam as apostas para a Selic, o que move a curva de juros futuros (DI).'}
  };
  function ligar(e) {
    const txt=String(e?.titulo||'')+' '+String(e?.tema||''),out=[],vistos=new Set();
    for(const [re,tk,porque] of LIGA)if(re.test(txt)&&!vistos.has(tk)){vistos.add(tk);out.push({tk,porque,tipo:'regra'});}
    const rel=e?.relacoes,diretos=new Set(rel?.diretos||(e?.tickers||[]).filter(t=>!['WIN','WDO','DI'].includes(t)));
    for(const tk of (e?.tickers||[])){if(vistos.has(tk))continue;vistos.add(tk);
      if(diretos.has(tk)){out.push({tk,porque:'O título cita '+tk+' diretamente.',tipo:'direto'});continue}
      const h=HIP[tk];if(h)out.push({tk,porque:h[e?.tema]||h._||h.politica_economica,tipo:'hipotese'});}
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
  function importante(e) { return !!e&&(e.prioridade==='alta'||oficial(e)||(e.prioridade==='media'&&ligar(e).some(l=>l.tipo!=='hipotese'))); }
  function estudo(e) {
    const lig=ligar(e);
    const chips=lig.length?'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'+lig.map(l=>'<button type="button" class="btn s" data-intel-ticker="'+escape(l.tk)+'" style="min-height:28px;padding:3px 9px;font-size:11.5px">'+escape(l.tk)+'</button>').join('')+'</div>':'';
    const detalhes=lig.length?'<details style="margin-top:8px"><summary style="cursor:pointer;font-size:12px;color:var(--gold,#C9A66B);font-weight:600">Ver impacto nos ativos ('+lig.length+') e laboratório</summary>'+
      '<ul class="i833-lig" style="margin-top:6px">'+lig.map(l=>'<li'+(l.tipo==='hipotese'?' class="i852-hip"':'')+'><b>'+escape(l.tk)+'</b> <span>'+escape(l.porque)+'</span></li>').join('')+'</ul>'+
      '<button type="button" class="i833-lab" data-intel-study="'+escape(e.id)+'">Abrir no laboratório</button></details>'
      :'<button type="button" class="i833-lab" style="margin-top:6px" data-intel-study="'+escape(e.id)+'">Abrir no laboratório</button>';
    return '<div class="i833-estudo"><div class="sm" style="line-height:1.5"><b>Por que importa:</b> '+escape(transmissao(e))+'.</div>'+chips+detalhes+'</div>';
  }
  function fatosHtml() {
    const lista=timeline().filter(e=>importante(e)||minha(e)).sort((a,b)=>minha(b)-minha(a)).slice(0,5);
    if(!lista.length)return '<header><h2>Fatos que importam hoje</h2></header><p class="mut sm">Nenhuma notícia importante ligada aos seus ativos ou ao mercado nas fontes carregadas.</p>';
    return '<header><h2>Fatos que importam hoje</h2><span class="ui-badge">'+lista.length+' de '+timeline().length+' notícias</span></header>'+
      lista.map(e=>'<article class="i833-fato">'+tag(oficial(e)?'fato':'publicada')+sentTag(e)+(minha(e)?'<span class="i838-meu">Seu ativo</span> ':'')+'<b>'+escape(tit(e))+'</b><div class="mut sm">'+when(e.ultimaAtualizacao)+' · '+escape((e.fontes||[]).at(-1)?.nome||'Fonte')+'</div>'+estudo(e)+'</article>').join('');
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
      '<p class="mut sm">Histórico diário (Yahoo Finance). Comparação de direção, não previsão.</p>';
  }

  /* v886/v888: Paridade de ADRs (cesta de ADRs + USD/BRL) comparada ao fechamento B3 real (Profit / TradingView), com PETR4 e WIN teórico. */
  const ADR_REGRAS=[
    {s:'PBR',tk:'PETR4',on:'PETR3',razao:2,peso:12.0},
    {s:'VALE',tk:'VALE3',razao:1,peso:11.5},
    {s:'ITUB',tk:'ITUB4',razao:1,peso:7.5},
    {s:'BBD',tk:'BBDC4',razao:1,peso:3.5},
    {s:'ABEV',tk:'ABEV3',razao:1,peso:2.8},
    {s:'GGB',tk:'GGBR4',razao:1,peso:1.3}
  ];
  function cotacaoApp(tk){
    const k=String(tk||'').toUpperCase();
    if(w.DiarioMarketData?.has(k))return w.DiarioMarketData.get(k);
    try{
      if(typeof CQ!=='undefined'&&CQ){
        const p=CQ.pf&&CQ.pf[k];
        if(p&&Number(p.px)>0)return {px:Number(p.px),d1:p.d1==null||p.d1===''?null:Number(p.d1),fonte:'Profit'};
        for(const g of Object.values(CQ.d||{})){
          for(const r of (g?.itens||[])){
            const sym=String(r?.ticker||r?.c||r?.s||'').toUpperCase().replace(/^.*:/,'');
            if(sym===k&&Number(r?.px)>0)return {px:Number(r.px),d1:r.d1==null||r.d1===''?null:Number(r.d1),fonte:'TradingView'};
          }
        }
      }
    }catch(_){}
    try{
      if(typeof LV!=='undefined'&&LV?.px&&LV.px[k]?.ult>0)return {px:Number(LV.px[k].ult),d1:null,fonte:'Profit'};
    }catch(_){}
    try{
      const av=w.DiarioAnalisesPlus?.avaliarAtivo?.(k);
      if(av&&Number(av.preco)>0)return {px:Number(av.preco),d1:null,fonte:'B3'};
    }catch(_){}
    return null;
  }
  function paridadeAdrsHtml(){
    const m=state.mercado;if(!m||!Array.isArray(m.adrs)||!m.adrs.length)return '';
    const itens=(m.mercados?.grupos||[]).flatMap(g=>g.itens||[]);
    const fxApp=cotacaoApp('USDBRL');
    const fxObj=typeof w!=='undefined'&&w.DiarioMarketData?w.DiarioMarketData.get('BRL=X'):itens.find(i=>/USD\/?BRL/i.test(String(i.n||'')));
    const ewzObj=typeof w!=='undefined'&&w.DiarioMarketData?w.DiarioMarketData.get('EWZ'):itens.find(i=>/^EWZ\b/i.test(String(i.n||'')));
    const fx=Number(fxApp?.px||fxObj?.px),fxD1=Number(fxApp?.d1!=null&&Number.isFinite(fxApp.d1)?fxApp.d1:fxObj?.d1);
    if(!Number.isFinite(fx)||fx<=0)return '';
    const fxPct=Number.isFinite(fxD1)?fxD1:0;
    const pct=v=>(v>=0?'+':'')+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const brl=v=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const ibovRef=cotacaoApp('IBOV');
    const winRef=cotacaoApp('WIN')||cotacaoApp('WINFUT')||cotacaoApp('WIN1!');
    let somaPond=0,somaPeso=0,comB3=0;
    const linhas=[];
    for(const reg of ADR_REGRAS){
      const a=m.adrs.find(x=>String(x.s||'').toUpperCase()===reg.s);
      if(!a||!Number.isFinite(Number(a.px))||Number(a.px)<=0)continue;
      const pxUsd=Number(a.px),chpUsd=Number.isFinite(Number(a.chp))?Number(a.chp):0;
      const teoricoBase=(pxUsd/reg.razao)*fx;
      const b3Ref=cotacaoApp(reg.tk);
      const fechB3=b3Ref&&b3Ref.px>0?b3Ref.px:null;
      let teorico=teoricoBase,gapPct=null;
      if(reg.on){
        const onRef=cotacaoApp(reg.on);
        if(fechB3&&onRef&&onRef.px>0){
          teorico=teoricoBase*(fechB3/onRef.px);
          gapPct=((teoricoBase/onRef.px)-1)*100;
        }
      }
      if(gapPct==null)gapPct=fechB3?((teorico/fechB3)-1)*100:((1+chpUsd/100)*(1+fxPct/100)-1)*100;
      if(fechB3)comB3++;
      somaPond+=gapPct*reg.peso;somaPeso+=reg.peso;
      linhas.push({tk:reg.tk,adr:reg.s,razao:reg.razao,pxUsd,fechB3,teorico,gapPct});
    }
    if(!linhas.length)return '';
    const ibovVar=somaPeso>0?somaPond/somaPeso:0;
    const ibovPts=ibovRef&&ibovRef.px>0?Math.round(ibovRef.px*(1+ibovVar/100)):null;
    const winPts=winRef&&winRef.px>0?Math.round((winRef.px*(1+ibovVar/100))/5)*5:null;
    const ewzBrl=ewzObj&&Number.isFinite(Number(ewzObj.d1))?((1+Number(ewzObj.d1)/100)*(1+fxPct/100)-1)*100:null;
    const cor=v=>v>0.15?'ui-g':v<-0.15?'ui-r':'';
    const trs=linhas.map(l=>'<tr><td style="padding:4px 6px"><b>'+l.tk+'</b> <span class="mut">('+l.adr+(l.razao>1?' ÷'+l.razao:'')+')</span></td><td style="padding:4px 6px;text-align:right">'+(l.fechB3?brl(l.fechB3):'—')+'</td><td style="padding:4px 6px;text-align:right"><b>'+brl(l.teorico)+'</b></td><td style="padding:4px 6px;text-align:right"><b class="'+cor(l.gapPct)+'">'+pct(l.gapPct)+'</b></td></tr>').join('');
    return '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid rgba(201,166,107,.24);background:rgba(201,166,107,.05)">'+
      '<p class="sm" style="margin:0"><b>Ibovespa teórico (Cesta de ADRs):</b> '+(ibovPts?'<b>'+ibovPts.toLocaleString('pt-BR')+' pts</b> ':'')+'<b class="'+cor(ibovVar)+'">'+pct(ibovVar)+'</b>'+
      (winPts?' · <b>WIN teórico:</b> <b>'+winPts.toLocaleString('pt-BR')+' pts</b>':'')+
      (ewzBrl!=null?' · <b>EWZ em R$:</b> <b class="'+cor(ewzBrl)+'">'+pct(ewzBrl)+'</b>':'')+
      ' · Dólar: <b>'+brl(fx)+'</b></p>'+
      '<details style="margin-top:6px"><summary class="sm" style="cursor:pointer;color:var(--accent,#C9A66B)">Ver preço teórico das ações (Paridade de ADRs · '+linhas.length+' ativos)</summary>'+
      '<div style="overflow-x:auto;margin-top:6px"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="border-bottom:1px solid rgba(255,255,255,.1)"><th style="text-align:left;padding:4px 6px">Ação (ADR)</th><th style="text-align:right;padding:4px 6px">Fech. B3</th><th style="text-align:right;padding:4px 6px">Teórico</th><th style="text-align:right;padding:4px 6px">Gap</th></tr></thead><tbody>'+trs+'</tbody></table></div>'+
      '<p class="mut sm" style="margin:6px 0 0">Fórmula: <b>(ADR em US$ ÷ equivalência) × USD/BRL</b> vs fechamento B3 ('+(comB3?'Profit/TradingView':'variação ADR+dólar')+'). PETR4 ajustada pelo spread real PETR4/PETR3 sobre PBR. Referência teórica, não preço de leilão.</p></details></div>';
  }
  /* v835: sinais entre mercados — expectativa de abertura do Ibovespa (B3) e pares que se separaram hoje. */
  function sinaisHtml() {
    const x=state.extras;
    const pct=v=>v==null?'—':(v>0?'+':'')+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    const c=w.DiarioSessoes?.context(),b3=c?.b3?.state||w.DiarioSessoes?.session('B3')?.state;
    const gapTitulo=c?.mode==='cripto_macro'||c?.mode==='b3_fechada'?'Expectativa de abertura da B3 na próxima sessão':'Expectativa de abertura do Ibovespa (B3)';
    const paridade=b3!=='regular'?paridadeAdrsHtml():'';
    const gap=(x?.gap||paridade)&&b3!=='regular'?'<div class="i835-bloco"><b>'+gapTitulo+'</b>'+(x?.gap?'<p class="sm">'+escape(x.gap.texto)+'</p>':'')+paridade+'</div>':'';
    const q=(x?.pares||[]).filter(p=>p.quebrou);
    const pares=q.length?'<div class="i835-bloco"><b>Correlação quebrada hoje</b>'+q.map(p=>'<p class="sm"><b>'+escape(p.a)+' '+pct(p.hojeA)+'</b> × <b>'+escape(p.b)+' '+pct(p.hojeB)+'</b> — costumam andar juntos (correlação de 60 dias '+escape(String(p.correlacao60).replace('.',','))+'). '+escape(p.porque)+'</p>').join('')+'</div>':'';
    if(!gap&&!pares)return '';
    return '<header><h2>Sinais entre mercados</h2><span class="ui-badge">Referência externa</span></header>'+gap+pares+'<p class="mut sm">Leitura automática de dados públicos; não é recomendação.</p>';
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
      (evs.length?'<p class="sm"><b>Notícias ligadas:</b></p><ul class="i835-nts">'+evs.map(e=>'<li>'+escape(tit(e))+' <span class="mut">'+when(e.ultimaAtualizacao)+'</span></li>').join('')+'</ul>':'');
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
    const main=home.querySelector('.v829-split>.ui-main');
    const aside=home.querySelector('.v829-split>.ui-aside');
    if(!main)return;
    /* Bloco de Mercado: Sinais/Paridade ADRs logo após EUA/ADRs (antes de Movimentos fortes) */
    const mktAnchor=main.querySelector('.v827-eua')||main.querySelector('.v4-iacard');
    let si=home.querySelector('#i835-sinais');const sh=sinaisHtml();
    if(sh){if(!si){si=document.createElement('section');si.id='i835-sinais';si.className='ui-card i833-card';(mktAnchor?mktAnchor.after(si):main.append(si));}if(si.innerHTML!==sh)si.innerHTML=sh;}else si?.remove();
    /* Bloco de Notícias: Fatos priorizados sempre DEPOIS dos blocos de mercado/movimentos */
    const newsAnchor=main.querySelector('#v520-fa')||main.querySelector('#v519-ins')||main.querySelector('#v518-mov')||si||mktAnchor;
    let f=home.querySelector('#i833-fatos');if(!f){f=document.createElement('section');f.id='i833-fatos';f.className='ui-card i833-card';(newsAnchor?newsAnchor.after(f):main.append(f));}
    const fh=fatosHtml();if(f.innerHTML!==fh)f.innerHTML=fh;
    traduzirTitulos(timeline().slice(0,40),()=>{const h=fatosHtml();if(f.isConnected&&f.innerHTML!==h)f.innerHTML=h;});
    /* Bloco Complementar (menor prioridade): Pontos e Analogia recolhidos embaixo/lateral */
    const extraHost=aside||main;
    let po=home.querySelector('#i838-pontos');const ph=pontosHtml();
    if(ph){
      if(!po){po=document.createElement('details');po.id='i838-pontos';po.className='ui-card i833-card';extraHost.append(po);}
      const wrap='<summary style="cursor:pointer;font-weight:700;font-size:14px">Pontos de atenção da abertura <span class="mut sm" style="font-weight:400">· toque para abrir</span></summary><div style="margin-top:8px">'+ph+'</div>';
      if(po.innerHTML!==wrap)po.innerHTML=wrap;
    }else po?.remove();
    let an=home.querySelector('#i833-analogia');const ah=analogiaHtml();
    if(ah){
      if(!an){an=document.createElement('details');an.id='i833-analogia';an.className='ui-card i833-card';extraHost.append(an);}
      const wrap='<summary style="cursor:pointer;font-weight:700;font-size:14px">Analogia histórica do pregão <span class="mut sm" style="font-weight:400">· toque para abrir</span></summary><div style="margin-top:8px">'+ah+'</div>';
      if(an.innerHTML!==wrap)an.innerHTML=wrap;
    }else an?.remove();
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
  /* v884: Revisão Pós-Pregão da Áurea (lê trades locais dos últimos 14 dias e cruza com os livros do Cérebro). */
  function analiseTradesRecentes(){
    if(typeof S==='undefined'||!S||!Array.isArray(S.trades))return null;
    const lim=new Date(Date.now()-14*86400000).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
    const list=S.trades.filter(t=>String(t.dtx||t.dt||'').slice(0,10)>=lim&&(typeof isOpen==='function'?!isOpen(t):t.exit!=null));
    if(!list.length)return null;
    let mN=0,mW=0,tN=0,tW=0,semStop=0,totPL=0;
    const porAtivo={};
    for(const t of list){
      let pl=null;try{pl=typeof cBRL==='function'?cBRL(t)?.pl:null;}catch(_){}
      if(!number(pl))continue;
      totPL+=pl;
      if(!(Number(t.stop)>0))semStop++;
      const h=Number(String(t.hr||t.h||String(t.dt||'').slice(11,13)||'').slice(0,2));
      if(Number.isFinite(h)&&h>0){if(h<12){mN++;if(pl>0)mW++;}else{tN++;if(pl>0)tW++;}}
      const tk=String(t.ativo||t.tk||'Outro').toUpperCase();
      porAtivo[tk]=(porAtivo[tk]||0)+pl;
    }
    const rank=Object.entries(porAtivo).sort((a,b)=>b[1]-a[1]);
    return {n:list.length,totPL,mN,mTaxa:mN?Math.round(mW/mN*100):null,tN,tTaxa:tN?Math.round(tW/tN*100):null,semStop,melhor:rank[0]||null,pior:rank.length>1?rank[rank.length-1]:null};
  }
  function ultimosRegistrosDia(){
    if(typeof S==='undefined'||!S||!Array.isArray(S.trades))return '';
    const rec=S.trades.slice().sort((a,b)=>String(b.dtx||b.dt||'').localeCompare(String(a.dtx||a.dt||''))).slice(0,4);
    if(!rec.length)return '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)"><p style="margin:0"><b>Últimos registros</b></p><p class="mut sm" style="margin:4px 0 0">Nenhum trade registrado ainda. Toque no + em Operações para registrar o primeiro.</p></div>';
    const rows=rec.map(t=>{
      let pl=null;try{pl=typeof cBRL==='function'?cBRL(t)?.pl:null;}catch(_){}
      const tk=String(t.ativo||t.tk||'—').toUpperCase(),dt=br(String(t.dtx||t.dt||'').slice(0,10));
      const plTxt=number(pl)?'<b class="'+(pl>=0?'ui-g':'ui-r')+'">'+(pl>=0?'+':'')+pl.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</b>':'<span class="mut">em aberto</span>';
      return '<li style="display:flex;justify-content:space-between;gap:8px;padding:3px 0"><span><b>'+escape(tk)+'</b> <span class="mut sm">'+escape(dt)+'</span></span>'+plTxt+'</li>';
    }).join('');
    return '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)"><p style="margin:0 0 4px"><b>Últimos registros</b></p><ul style="list-style:none;margin:0;padding:0;font-size:12.5px">'+rows+'</ul></div>';
  }
  /* v896: Semáforo 'Posso operar agora?' — cruza Escala de Turno, stops do dia, horário histórico e agenda 30 min. */
  function semaforoOperarHtml(){
    try{
      const hoje=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
      const horaAtual=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}).format(new Date()));
      let nv='g',titulo='🟢 Liberado · mão normal',motivos=[];
      const sobe=(x)=>{if(x==='r')nv='r';else if(x==='a'&&nv!=='r')nv='a';};
      // 1) Escala de turno
      if(typeof tcod==='function'){
        const tc=tcod(hoje);
        if(tc==='8'){sobe('r');motivos.push('Turno 8h–17h hoje: não operar no expediente.');}
        else if(tc==='0'){sobe('a');motivos.push('Saída da madrugada (turno 0): operar só descansado e com 50% da mão.');}
        else if(tc==='16'){motivos.push('Turno 16h–00h: janela limpa das 9h às 14h30.');}
        else if(tc==='F'){motivos.push('Folga na escala: dia livre.');}
      }
      // 2) Sequência de stops hoje
      const trs=(typeof S!=='undefined'&&Array.isArray(S?.trades))?S.trades:[];
      const trHoje=trs.filter(t=>String(t.dtx||t.dt||'').slice(0,10)===hoje&&t.status!=='aberta');
      let lossSeq=0;
      for(let i=trHoje.length-1;i>=0;i--){if(Number(trHoje[i].r||0)<0)lossSeq++;else break;}
      if(lossSeq>=2){sobe('r');motivos.push(lossSeq+' stops seguidos hoje: pare ou ative o checklist anti-tilt.');}
      else if(lossSeq===1){sobe('a');motivos.push('1 stop na última operação: respire e reduza a mão antes do próximo clique.');}
      // 3) Faixa horária histórica (últimos 90 trades)
      const faixa=h=>h<10?'9h–10h':h<12?'10h–12h':h<15?'12h–15h':'15h–18h';
      const fAtual=faixa(horaAtual);
      const naFaixa=trs.slice(-120).filter(t=>{const h=Number(String(t.hr||t.h||String(t.dt||'').slice(11,13)||'').slice(0,2));return Number.isFinite(h)&&faixa(h)===fAtual&&Number.isFinite(Number(t.r));});
      if(naFaixa.length>=5){
        const wins=naFaixa.filter(t=>Number(t.r)>0).length,tx=Math.round(wins/naFaixa.length*100);
        const sal=naFaixa.reduce((a,t)=>a+Number(t.r||0),0);
        if(sal<0&&tx<45){sobe('a');motivos.push('Faixa '+fAtual+': histórico negativo ('+tx+'% acerto em '+naFaixa.length+' trades) — mão menor.');}
        else motivos.push('Faixa '+fAtual+': '+tx+'% de acerto no seu histórico ('+naFaixa.length+' trades).');
      }
      // 4) Agenda alto impacto nos próximos 30 min
      const agoraMs=Date.now();
      const proxEv=(state.agenda?.eventos||[]).find(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&e.em&&Math.abs(Date.parse(e.em)-agoraMs)<=30*60000);
      if(proxEv){sobe('a');motivos.push('Evento alto impacto em <30 min: ['+proxEv.p+'] '+String(proxEv.t||'').slice(0,42)+' — aguarde divulgação.');}
      if(nv==='r')titulo='🔴 Alerta de Proteção · Pare ou aguarde';
      else if(nv==='a')titulo='🟡 Atenção · Mão reduzida (50%)';
      const corB=nv==='r'?'rgba(239,68,68,.45)':nv==='a'?'rgba(201,166,107,.55)':'rgba(16,185,129,.4)';
      const bgB=nv==='r'?'rgba(239,68,68,.09)':nv==='a'?'rgba(201,166,107,.09)':'rgba(16,185,129,.07)';
      return '<details style="margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid '+corB+';background:'+bgB+'"'+(nv!=='g'?' open':'')+'>'+
        '<summary style="cursor:pointer;font-weight:700;font-size:13px">🚦 Posso operar agora? · '+titulo+'</summary>'+
        '<ul style="margin:6px 0 0;padding-left:18px;font-size:12px;line-height:1.5">'+(motivos.length?motivos.map(x=>'<li>'+escape(x)+'</li>').join(''):'<li>Sem restrições de turno, sequência ou agenda neste momento.</li>')+'</ul>'+
        (nv!=='g'?'<div style="margin-top:8px"><button type="button" class="btn s" data-aurea-antitilt="1">✦ Checklist Anti-Tilt com Munger</button></div>':'')+
        '</details>';
    }catch(_){return '';}
  }
  const PILULAS_CEREBRO=[
   ['Ray Dalio · Ciclos de Dívida','Quando o juro real supera o crescimento do PIB (r > g), a dívida cresce sozinha — proteja o poder de compra com diversificação entre classes descorrelacionadas.'],
   ['Jesse Livermore · Tape & Stop','Nunca faça preço médio para trás numa operação perdedora. O mercado nunca está errado; opiniões frequentemente estão.'],
   ['Charlie Munger · Inversão','Inverta sempre: em vez de perguntar como ganhar mais hoje, pergunte o que faria você devolver o lucro da semana — e elimine esse hábito primeiro.'],
   ['Benjamin Graham · Margem de Segurança','O preço que você paga determina o seu risco. Comprar um ótimo ativo caro demais transforma qualidade em especulação.'],
   ['Harry Markowitz · Portfólio','Diversificação real é o único almoço grátis: combine ativos que reagem de formas opostas a juros, dólar e inflação.'],
   ['Ray Dalio · All Weather','Não tente adivinhar o próximo choque geopolítico — construa uma carteira que sobreviva tanto à inflação alta quanto à desaceleração.'],
   ['Tim Ferriss · Fear-Setting','Antes de clicar, nomeie o pior cenário e o stop exato. Quem controla o tamanho da perda joga para o longo prazo.']
  ];
  function pilulaDia(){
   const d=Math.floor(Date.now()/86400000);
   return PILULAS_CEREBRO[d%PILULAS_CEREBRO.length];
  }
  function radarBalancosHtml(){
   const meus=meusAtivos();if(!meus.length)return '';
   const set=new Set(meus.map(x=>String(x).toUpperCase()));
   const hits=timeline().filter(e=>/balan[çc]o|resultado|lucro|trimestr|divulg/i.test(String(e.titulo||''))&&(e.relacoes?.diretos||[]).some(t=>set.has(String(t).toUpperCase()))).slice(0,3);
   if(!hits.length)return '';
   return '<div style="margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid rgba(201,166,107,.45);background:rgba(201,166,107,.08);font-size:12.5px"><b>📆 Radar de Balanços (sua Carteira/Teses):</b><ul style="margin:4px 0 0;padding-left:16px">'+
    hits.map(e=>'<li>'+escape(String(e.titulo||'').slice(0,95))+'</li>').join('')+'</ul></div>';
  }
  const TAGS_HABITO=['✅ Segui o plano','✅ Stop respeitado','⚠️ Entrei adiantado','⚠️ Movi o stop','⚠️ Overtrading','⚠️ Operei cansado'];
  function getTagsMap(){try{return JSON.parse(localStorage.getItem('dt-tags-v924')||'{}')||{}}catch{return {}}}
  function raioxTraderHtml(){
   try{
    const trs=((typeof S!=='undefined'&&Array.isArray(S?.trades))?S.trades:[]).filter(t=>t&&t.status!=='aberta');
    const comPl=trs.map(t=>{
     let pl=Number(t.r);
     if(!Number.isFinite(pl)){try{pl=Number(typeof cBRL==='function'?cBRL(t)?.pl:NaN)}catch(_){}}
     return {t,pl,id:String(t.id||t.dt||'')};
    }).filter(x=>Number.isFinite(x.pl));
    if(comPl.length<3)return '<details style="margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid var(--bd);background:var(--bg)"><summary style="cursor:pointer;font-weight:700;font-size:13px">📊 Raio-X Estatístico, Risco de Ruína &amp; Card PNG</summary><p class="mut sm" style="margin:6px 0 0">Registre pelo menos 3 operações encerradas para liberar o Raio-X por horário, dia, turno, Expectativa Matemática e Card PNG.</p></details>';
    const rec=comPl.slice(-150);
    const wins=rec.filter(x=>x.pl>0),losses=rec.filter(x=>x.pl<0);
    const wr=wins.length/rec.length,avgW=wins.length?wins.reduce((a,x)=>a+x.pl,0)/wins.length:0,avgL=losses.length?Math.abs(losses.reduce((a,x)=>a+x.pl,0)/losses.length):0;
    const payoff=avgL>0?avgW/avgL:0,exp=wr*avgW-(1-wr)*avgL;
    const kelly=payoff>0?Math.max(0,Math.min(100,((wr-(1-wr)/payoff)*100)*0.25)):0;
    const fmtBRL=v=>(v>=0?'+':'−')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
    const agrupa=(fn)=>{
     const m=new Map();
     rec.forEach(x=>{const k=fn(x.t);if(!k)return;const o=m.get(k)||{k,n:0,w:0,s:0};o.n++;if(x.pl>0)o.w++;o.s+=x.pl;m.set(k,o)});
     return [...m.values()].map(o=>'<tr><td><b>'+escape(o.k)+'</b></td><td>'+o.n+'</td><td>'+Math.round(o.w/o.n*100)+'%</td><td style="color:'+(o.s>=0?'#10B981':'#EF4444')+';font-weight:700">'+fmtBRL(o.s)+'</td></tr>').join('');
    };
    const faixaH=t=>{const h=Number(String(t.hr||t.h||String(t.dt||'').slice(11,13)||'').slice(0,2));return Number.isFinite(h)?(h<10?'9h–10h':h<12?'10h–12h':h<15?'12h–15h':'15h–18h'):''};
    const diaSem=t=>{const dt=String(t.dtx||t.dt||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(dt))return '';return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][new Date(dt+'T12:00:00Z').getUTCDay()]};
    const turnoFn=t=>{const dt=String(t.dtx||t.dt||'').slice(0,10);if(!dt||typeof tcod!=='function')return '';const c=tcod(dt);return ({F:'Folga','16':'Turno 16h','0':'Pós-madrug. 0h','8':'Turno 8h'})[c]||''};
    const tbl=(tit,rows)=>rows?'<p class="sm" style="margin:8px 0 4px"><b>'+tit+'</b></p><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="text-align:left;color:var(--mut)"><th>Faixa</th><th>Qtd</th><th>Acerto</th><th>Saldo</th></tr></thead><tbody>'+rows+'</tbody></table>':'';
    // Tags de hábitos + custo real dos erros
    const tmap=getTagsMap(),ult=comPl[comPl.length-1],ultTags=Array.isArray(tmap[ult.id])?tmap[ult.id]:[];
    const custoTag={};
    rec.forEach(x=>{(tmap[x.id]||[]).forEach(tg=>{custoTag[tg]=(custoTag[tg]||{n:0,s:0});custoTag[tg].n++;custoTag[tg].s+=x.pl})});
    const custoRows=Object.entries(custoTag).sort((a,b)=>a[1].s-b[1].s).map(([tg,o])=>'<li>'+escape(tg)+': <b>'+o.n+'x</b> · <b style="color:'+(o.s>=0?'#10B981':'#EF4444')+'">'+fmtBRL(o.s)+'</b></li>').join('');
    return '<details style="margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid var(--bd);background:var(--bg)">'+
     '<summary style="cursor:pointer;font-weight:700;font-size:13px">📊 Raio-X Estatístico, Risco de Ruína &amp; Card PNG <small class="mut">('+rec.length+' trades)</small></summary>'+
     '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin:8px 0;font-size:12px">'+
      '<div style="padding:7px;border:1px solid var(--bd);border-radius:6px"><small class="mut" style="display:block">Acerto</small><b>'+Math.round(wr*100)+'%</b></div>'+
      '<div style="padding:7px;border:1px solid var(--bd);border-radius:6px"><small class="mut" style="display:block">Payoff</small><b>'+payoff.toFixed(2).replace('.',',')+'x</b></div>'+
      '<div style="padding:7px;border:1px solid var(--bd);border-radius:6px"><small class="mut" style="display:block">Expectativa/trade</small><b style="color:'+(exp>=0?'#10B981':'#EF4444')+'">'+fmtBRL(exp)+'</b></div>'+
      '<div style="padding:7px;border:1px solid var(--bd);border-radius:6px"><small class="mut" style="display:block">Risco ideal (¼ Kelly)</small><b>'+(kelly>0?kelly.toFixed(1).replace('.',',')+'%':'Conservador 0,5%')+'</b></div>'+
     '</div>'+
     '<p class="mut sm" style="margin:2px 0 8px">Risco de Ruína: com risco de 1% por trade, sua conta suporta <b>10 stops seguidos</b> até −10% e <b>20 stops</b> até −20%.</p>'+
     tbl('Por horário',agrupa(faixaH))+tbl('Por dia da semana',agrupa(diaSem))+tbl('Por turno da escala',agrupa(turnoFn))+
     '<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--bd)">'+
      '<p class="sm" style="margin:0 0 6px"><b>🏷️ Pós-Trade em 10s (etiquetar último trade: '+escape(String(ult.t.ativo||ult.t.tk||'—').toUpperCase())+')</b></p>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap">'+TAGS_HABITO.map(tg=>'<button type="button" class="btn s" data-aurea-tag="'+escape(ult.id)+'|'+escape(tg)+'" style="'+(ultTags.includes(tg)?'border-color:#C9A66B;background:rgba(201,166,107,.18)':'')+'">'+escape(tg)+'</button>').join('')+'</div>'+
      (custoRows?'<p class="sm" style="margin:8px 0 3px"><b>Custo/ganho real por hábito:</b></p><ul style="margin:0;padding-left:16px;font-size:12px">'+custoRows+'</ul>':'')+
     '</div>'+
     '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn s" data-aurea-cardpng="1">📸 Gerar Card PNG (Modo Privacidade)</button></div>'+
     '</details>';
   }catch(_){return '';}
  }
  function meuDia(){
    const c=w.DiarioSessoes?.context(),manual=w.DiarioSessaoVisual?.manual?.(),
      phase=manual||c?.phase, data=c?.b3?.nextDate;
    const task=c?.mode==='cripto_macro'?'Mercado B3 fechado: revisar a rotina e preparar os próximos eventos.':
      c?.mode==='b3_fechada'?'B3 fechada: não tratar referências antigas como negociações em tempo real.':
      phase==='pre'?'Conferir cenário, regras e notícias antes de operar.':
      phase==='during'?'Acompanhar riscos, execução e operações abertas sem somá-las ao resultado realizado.':
      'Conciliar operações encerradas, checklist original e plano de amanhã.';
    const st14=analiseTradesRecentes();
    const pil=pilulaDia();
    const pilulaHtml='<div style="margin:8px 0;padding:8px 10px;border-radius:8px;border:1px solid rgba(201,166,107,.28);background:rgba(201,166,107,.05);font-size:12.5px"><b>🧠 Pílula do Cérebro · '+escape(pil[0])+'</b><p class="mut sm" style="margin:4px 0 0">'+escape(pil[1])+'</p></div>';
    const padroes=st14?
      '<div style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid rgba(201,166,107,.28);background:rgba(201,166,107,.06)">'+
      '<p style="margin:0 0 4px"><b>✦ Revisão da Áurea (últimos 14 dias · '+st14.n+' trades)</b></p>'+
      '<p class="mut sm" style="margin:0">'+
        (st14.mTaxa!=null?'Manhã (&lt;12h): <b>'+st14.mTaxa+'%</b> ('+st14.mN+')':'')+
        (st14.mTaxa!=null&&st14.tTaxa!=null?' · ':'')+
        (st14.tTaxa!=null?'Tarde (≥12h): <b>'+st14.tTaxa+'%</b> ('+st14.tN+')':'')+
        (st14.melhor?' · Melhor: <b>'+escape(st14.melhor[0])+'</b>':'')+
        (st14.pior&&st14.pior[1]<0?' · Atenção: <b>'+escape(st14.pior[0])+'</b>':'')+
        (st14.semStop?' · '+st14.semStop+' sem stop':'')+
      '</p>'+
      '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn s" data-aurea-revisao="1"'+(state.revisaoBusy?' disabled':'')+'>'+(state.revisaoBusy?'Consultando seus livros…':'✦ Revisão da Áurea com seus livros')+'</button></div>'+
      (state.revisaoOut?'<div class="sm" style="margin-top:8px;line-height:1.5">'+state.revisaoOut+'</div>':'')+
      '</div>':'';
    return '<div class="v810-intel-day"><strong>Orientação da sessão</strong><p>'+escape(task)+'</p>'+
      semaforoOperarHtml()+
      (state.modoFoco
        ?'<p class="mut sm" style="margin:6px 0">🎯 Modo Foco Pregão ativo — blocos secundários recolhidos para operar sem ruído.</p>'
        :pilulaHtml+radarBalancosHtml()+raioxTraderHtml()+padroes+ultimosRegistrosDia())+
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
  /* v884/v885: Edições automáticas da Áurea (Fim de semana + Manhã, Meio-dia, Fechamento) cruzando B3 + EUA. */
  function edicaoAuto(context){
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
    const hm=Number(parts.find(x=>x.type==='hour')?.value||0)*60+Number(parts.find(x=>x.type==='minute')?.value||0);
    const b3=context?.b3?.state,us=context?.us?.state;
    if(context?.mode==='cripto_macro'||context?.mode==='b3_fechada')return 'fimdesemana';
    if(b3==='pre'||(hm<720&&b3!=='post'&&b3!=='fechado'))return 'manha';
    if((b3==='regular'||us==='regular')&&hm>=720&&hm<990)return 'meiodia';
    return 'fechamento';
  }
  /* v896: Status real dos Futuros EUA (CME Globex) em America/New_York (dom 18h ET -> sex 17h ET, pausa 17h-18h ET). */
  function futurosEuaStatus(){
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      const wd=parts.find(x=>x.type==='weekday')?.value||'';
      const h=Number(parts.find(x=>x.type==='hour')?.value||0);
      const m=Number(parts.find(x=>x.type==='minute')?.value||0);
      const hm=h*60+m;
      if(wd==='Sat')return {aberto:false,label:'Fechado (reabre dom 18h ET)'};
      if(wd==='Sun')return hm>=1080?{aberto:true,label:'Aberto (CME Globex)'}:{aberto:false,label:'Abre hoje 18h ET'};
      if(wd==='Fri')return hm<1020?{aberto:true,label:'Aberto (CME Globex)'}:{aberto:false,label:'Fechado (reabre dom 18h ET)'};
      return (hm>=1020&&hm<1080)?{aberto:false,label:'Pausa diária (17h–18h ET)'}:{aberto:true,label:'Aberto (CME Globex)'};
    }catch(_){return {aberto:false,label:'—'};}
  }
  function contextoResumao956(c,agora=new Date()){
    const dia=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'America/Sao_Paulo'}).format(agora);
    const b3Fechada=['pre','fechado','post'].includes(c?.b3?.state);
    return {domingo:dia==='Sun',fimdesemana:dia==='Sun'||dia==='Sat',b3Fechada};
  }
  function resumoParidadeAdrs(){
    const m=state.mercado;if(!m||!Array.isArray(m.adrs)||!m.adrs.length)return '';
    const itens=(m.mercados?.grupos||[]).flatMap(g=>g.itens||[]);
    const fxApp=cotacaoApp('USDBRL');
    const fxObj=typeof w!=='undefined'&&w.DiarioMarketData?w.DiarioMarketData.get('BRL=X'):itens.find(i=>/USD\/?BRL/i.test(String(i.n||'')));
    const ewzObj=typeof w!=='undefined'&&w.DiarioMarketData?w.DiarioMarketData.get('EWZ'):itens.find(i=>/^EWZ\b/i.test(String(i.n||'')));
    const fx=Number(fxApp?.px||fxObj?.px),fxD1=Number(fxApp?.d1!=null&&Number.isFinite(fxApp.d1)?fxApp.d1:fxObj?.d1);
    if(!Number.isFinite(fx)||fx<=0)return '';
    const fxRaw=fxApp?.d1!=null&&Number.isFinite(fxApp.d1)?fxApp.d1:fxObj?.d1;
    const fxPct=fxRaw!=null&&fxRaw!==''&&Number.isFinite(fxD1)?fxD1:null;
    const pct=v=>(v>=0?'+':'')+v.toFixed(2).replace('.',',')+'%';
    const ibovRef=cotacaoApp('IBOV');
    let somaPond=0,somaPeso=0;const itensTxt=[];
    for(const reg of ADR_REGRAS){
      const a=m.adrs.find(x=>String(x.s||'').toUpperCase()===reg.s);
      if(!a||!Number.isFinite(Number(a.px))||Number(a.px)<=0)continue;
      const pxUsd=Number(a.px),chpUsd=a.chp!=null&&a.chp!==''&&Number.isFinite(Number(a.chp))?Number(a.chp):null;
      const teoricoBase=(pxUsd/reg.razao)*fx;
      const b3Ref=cotacaoApp(reg.tk);
      const fechB3=b3Ref&&b3Ref.px>0?b3Ref.px:null;
      let gapPct=null;
      if(reg.on){
        const onRef=cotacaoApp(reg.on);
        if(fechB3&&onRef&&onRef.px>0)gapPct=((teoricoBase/onRef.px)-1)*100;
      }
      if(gapPct==null)gapPct=fechB3&&!reg.on?((teoricoBase/fechB3)-1)*100:chpUsd!=null&&fxPct!=null?((1+chpUsd/100)*(1+fxPct/100)-1)*100:null;
      if(!Number.isFinite(gapPct))continue;
      somaPond+=gapPct*reg.peso;somaPeso+=reg.peso;
      itensTxt.push(reg.s+'→'+reg.tk+' '+pct(gapPct));
    }
    if(!itensTxt.length&&!ewzObj)return '';
    const ibovVar=somaPeso>0?somaPond/somaPeso:null;
    const ibovPts=ibovVar!=null&&ibovRef&&ibovRef.px>0?Math.round(ibovRef.px*(1+ibovVar/100)):null;
    const ewzUsd=ewzObj&&ewzObj.d1!=null&&ewzObj.d1!==''&&Number.isFinite(Number(ewzObj.d1))?Number(ewzObj.d1):null;
    const ewzBrl=ewzUsd!=null&&fxPct!=null?((1+ewzUsd/100)*(1+fxPct/100)-1)*100:null;
    return [
      ibovVar!=null?'Ibovespa teórico (Cesta parcial de ADRs, estimativa, não leilão): '+pct(ibovVar)+(ibovPts?' (~'+ibovPts.toLocaleString('pt-BR')+' pts)':''):'',
      ewzUsd!=null?'EWZ: '+pct(ewzUsd)+' em USD'+(ewzBrl!=null?' ('+pct(ewzBrl)+' em R$)':''):'',
      itensTxt.length?'ADRs brasileiras: '+itensTxt.slice(0,5).join(', '):''
    ].filter(Boolean).join(' · ');
  }
  function pulsoDoisMercados(){
    const groups=state.mercado?.mercados?.grupos;
    const all=Array.isArray(groups)?groups.flatMap(g=>(g.itens||[]).map(x=>({n:String(x.n||''),px:Number(x.px),d1:x.d1==null||x.d1===''?null:Number(x.d1)}))).filter(x=>Number.isFinite(x.d1)):[];
    const pick=rx=>all.find(x=>rx.test(x.n));
    const pickApp=(label,tks)=>{for(const t of tks){const c=cotacaoApp(t);if(c&&Number.isFinite(c.d1))return {n:label,px:c.px,d1:c.d1};}return null;};
    const pickLive=(label,tks,rx,app)=>{const central=w.DiarioMarketData;if(central&&tks.some(k=>central.has(k))){const q=tks.map(k=>central.get(k)).find(Boolean);return q&&Number.isFinite(q.d1)&&Math.abs(q.d1)<=35?{n:label,px:q.px,d1:q.d1,fonte:q.fonte,baseVariacao:q.baseVariacao}:null;}try{const now=Date.now(),td=typeof w.tapeDados==='function'?w.tapeDados()||{}:{};for(const k of tks){const q=(typeof w.tapeVivo==='function'&&w.tapeVivo(k))||td[k],c=q&&q.chg!=null&&q.chg!==''?Number(q.chg):null;const ts=q?.dadoEm?Date.parse(q.dadoEm):null;const fresh=ts==null||(Number.isFinite(ts)&&ts<=now+60000&&now-ts<12*3600000);if(q&&Number(q.px)>0&&Number.isFinite(c)&&Math.abs(c)<=35&&fresh)return {n:label,px:Number(q.px),d1:c};}}catch(_){}const p=rx?pick(rx):null;return p&&Math.abs(p.d1)<=35?{n:label,px:p.px,d1:p.d1}:(app?pickApp(label,app):null);};
    const fmtP=x=>x?x.n+' '+(x.d1>=0?'+':'')+x.d1.toFixed(2).replace('.',',')+'%':'';
    const br=[pickLive('IBOV',['^BVSP','IBOV'],/ibov|bvsp/i,['IBOV']),pickLive('USD/BRL',['BRL=X','USDBRL'],/usd\/?brl|d[oó]lar\s*[àa]\s*vista/i,['USDBRL']),pick(/di1|juros|ifix/i)].filter(Boolean);
    const us=[pickLive('S&P 500',['^GSPC'],/s&p\s*500(?!.*fut)|\bspx\b/i)||pickLive('S&P fut.',['ES=F'],/s&p.*fut|\bes1\b/i),pickLive('Nasdaq Composite',['^IXIC'],/nasdaq(?!.*fut)|\bndx\b/i)||pickLive('Nasdaq fut.',['NQ=F'],/nasdaq.*fut|\bnq1\b/i),pickLive('Dow',['^DJI'],/dow(?!.*fut)|\bdji\b/i)||pickLive('Dow fut.',['YM=F'],/dow.*fut|\bym1\b/i),pickLive('Brent',['BZ=F'],/brent/i)||pickLive('WTI',['CL=F'],/\bwti\b/i),pickLive('Ouro',['GC=F'],/ouro|gold/i),pickLive('DXY',['DX-Y.NYB','DXY'],/\bdxy\b/i,['DXY']),pickLive('EWZ',['EWZ'],/^ewz\b/i,['EWZ'])].filter(Boolean);
    const cripto=[pickLive('BTC',['BTC-USD','BTCUSDT'],/\bbtc\b|bitcoin/i,['BTC','BTCUSD','BTCUSDT']),pickLive('ETH',['ETH-USD','ETHUSDT'],/\beth\b|ethereum/i,['ETH','ETHUSD','ETHUSDT']),pickLive('SOL',['SOL-USD','SOLUSDT'],/\bsol\b|solana/i,['SOL','SOLUSD'])].filter(Boolean);
    const uniq=L=>{const seen=new Set();return L.filter(x=>{if(!x||seen.has(x.n))return false;seen.add(x.n);return true;});};
    const brU=uniq(br),usU=uniq(us).slice(0,7),crU=uniq(cripto).slice(0,3);
    const texto=[
      brU.length?'Brasil: '+brU.map(fmtP).join(' · '):'',
      usU.length?'Exterior: '+usU.map(fmtP).join(' · '):'',
      crU.length?'Cripto: '+crU.map(fmtP).join(' · '):''
    ].filter(Boolean).join(' | ');
    /* Termômetro Risk-On / Risk-Off (-100 a +100) + Detector de Divergência Intraday */
    const sp=usU.find(x=>/^S&P/.test(x.n))?.d1,nq=usU.find(x=>/^Nasdaq/.test(x.n))?.d1,dxy=usU.find(x=>x.n==='DXY')?.d1,oil=usU.find(x=>/^(Brent|WTI)$/.test(x.n))?.d1,btc=crU.find(x=>x.n==='BTC')?.d1;
    const ibv=brU.find(x=>x.n==='IBOV')?.d1,dol=brU.find(x=>/^(USD\/BRL|WDO)$/.test(x.n))?.d1,di=pick(/di1|juros/i)?.d1;
    let pts=0,pesos=0;
    const add=(v,wgt)=>{if(Number.isFinite(v)){pts+=Math.max(-3,Math.min(3,v))*wgt;pesos+=wgt;}};
    add(sp,30);add(nq,25);add(dxy!=null?-dxy*1.4:null,15);add(oil!=null?oil*0.5:null,10);add(btc!=null?btc*0.35:null,10);add(dol!=null?-dol*1.2:null,10);
    const riskScore=pesos?Math.max(-100,Math.min(100,Math.round((pts/pesos)*45))):null;
    const riskLabel=riskScore==null?'':riskScore>=25?'Apetite a Risco (Risk-On)':riskScore<=-25?'Aversão a Risco (Risk-Off)':'Neutro / Misto';
    let divergencia='';
    if(Number.isFinite(sp)&&Number.isFinite(dol)){
      if(sp>=0.45&&dol>=0.45&&(ibv==null||ibv<0.1))divergencia='🔗 Divergência local: exterior positivo (S&P '+sinalNum(sp)+'), mas dólar pressionado ('+sinalNum(dol)+') — fluxo fiscal/local mandando na B3.';
      else if(sp<=-0.45&&dol<=-0.45&&(ibv==null||ibv>-0.1))divergencia='🔗 Divergência positiva: exterior fraco (S&P '+sinalNum(sp)+'), mas dólar cedendo ('+sinalNum(dol)+') — fluxo gringo/commodities segurando o Brasil.';
      else if(Number.isFinite(di)&&di>=0.5&&sp>=0.3)divergencia='🔗 Atenção aos juros: S&P sobe lá fora, mas curva de DI abre forte — cuidado com compras esticadas no WIN.';
    }
    return {br:brU,us:usU,cripto:crU,texto,riskScore,riskLabel,divergencia};
  }
  function sinalNum(v){return (v>=0?'+':'')+Number(v).toFixed(2).replace('.',',')+'%';}
  function briefing() {
    const m=mercadoPlan(),context=w.DiarioSessoes?.context(),
      hot=w.DiarioInterpretacao?.prioritize(timeline(),context,Date.now(),context?.anchorAt?Date.parse(context.anchorAt):undefined)||
        timeline().filter(e=>e.prioridade==='alta');
    const mine=relacionados().filter(e=>e.prioridade==='alta');
    const edAuto=edicaoAuto(context),ed=state.edicaoManual||edAuto;
    const futUS=futurosEuaStatus();
    const META={
      fimdesemana:{
        rot:'📅 Fim de semana',
        titulo:futUS.aberto?'Edição de Fim de Semana · Futuros EUA Abertos':'Edição de Fim de Semana · Preparação da Semana',
        foco:futUS.aberto?'Futuros americanos (CME Globex) já estão abertos! Acompanhe S&P 500, Nasdaq, commodities e cripto (24/7) como termômetro para a abertura da B3 amanhã.':'B3 e Wall Street fechados. Acompanhe cripto (24/7), o último fechamento e a agenda da próxima semana.',
        cta:futUS.aberto?'✦ Analisar abertura dos Futuros & semana com a Áurea':'✦ Preparar a semana com a Áurea'
      },
      manha:{rot:'🌅 Manhã',titulo:'Edição da Manhã · Pré-abertura B3 & EUA',foco:'Preparação antes dos pregões: exterior, futuros EUA, dólar, agenda macro e ativos da sua carteira.',cta:'✦ Gerar resumão da Manhã com a Áurea'},
      meiodia:{rot:'☀️ Meio-dia',titulo:'Edição do Meio-dia · Pulso B3 & Wall Street',foco:'B3 e EUA em negociação simultânea: direção intraday, fluxo e notícias que estão mexendo.',cta:'✦ Gerar resumão do Meio-dia com a Áurea'},
      fechamento:{rot:'🌙 Fechamento',titulo:'Edição de Fechamento · Balanço B3 & EUA',foco:'Resumo do dia nos dois mercados e o que já entra no radar para a próxima sessão.',cta:'✦ Gerar resumão de Fechamento com a Áurea'}
    };
    const info=META[ed]||META.manha;
    const stNome=x=>({regular:'Aberto',pre:'Pré-mercado',post:'Pós-mercado',fechado:'Fechado',leilao:'Leilão'}[x]||'—');
    const b3St=stNome(context?.b3?.state),usSt=stNome(context?.us?.state);
    const pulso=pulsoDoisMercados();
    const hojeIso=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
    const agAlvo=(ed==='fechamento'||ed==='fimdesemana')&&context?.b3?.nextDate?context.b3.nextDate:hojeIso;
    const agEvs=(state.agenda?.eventos||[]).filter(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&e.em&&new Date(e.em).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})>=agAlvo)
      .slice(0,4).map(e=>new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' ['+e.p+'] '+String(e.t||'').slice(0,50));
    const keys=edAuto==='fimdesemana'?['fimdesemana','manha','meiodia','fechamento']:['manha','meiodia','fechamento'];
    const pills='<div class="aurea-ed-bar" style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px" role="tablist" aria-label="Edições da Áurea">'+
      keys.map(k=>'<button type="button" data-aurea-edicao="'+k+'" style="padding:4px 10px;border-radius:999px;font-size:11.5px;cursor:pointer;border:1px solid '+(ed===k?'rgba(201,166,107,.75)':'rgba(255,255,255,.14)')+';background:'+(ed===k?'rgba(201,166,107,.16)':'transparent')+';color:inherit;font-weight:'+(ed===k?'700':'500')+'">'+META[k].rot+(k===edAuto?' · agora':'')+'</button>').join('')+
      '</div>';
    const relogio='<p class="mut sm" style="margin:0 0 6px">B3: <b>'+escape(b3St)+'</b> · NYSE/Nasdaq: <b>'+escape(usSt)+'</b> · Futuros EUA: <b'+(futUS.aberto?' style="color:#10B981"':'')+'>'+escape(futUS.label)+'</b>'+(context?.b3?.nextDate?' · Próxima B3: '+escape(br(context.b3.nextDate)):'')+'</p>';
    const riskBar=pulso.riskScore!=null?'<div class="sm dt987-risk"><span>🧭 Humor Global: <b style="color:'+(pulso.riskScore>=25?'#10B981':pulso.riskScore<=-25?'#EF4444':'#C9A66B')+'">'+escape(pulso.riskLabel)+'</b></span><span style="display:flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums"><span style="display:inline-block;width:72px;height:6px;border-radius:99px;background:rgba(128,128,128,.22);overflow:hidden"><i style="display:block;height:100%;width:'+Math.round((pulso.riskScore+100)/2)+'%;background:'+(pulso.riskScore>=25?'#10B981':pulso.riskScore<=-25?'#EF4444':'#C9A66B')+'"></i></span><b>'+(pulso.riskScore>0?'+':'')+pulso.riskScore+'</b></span></div>':'';
    const divLine=pulso.divergencia?'<p class="sm" style="margin:6px 0;padding:7px 9px;border-radius:8px;border:1px solid rgba(201,166,107,.45);background:rgba(201,166,107,.09)">'+escape(pulso.divergencia)+'</p>':'';
    let gatilhosLine='';
    try{
      const ts=JSON.parse(localStorage.getItem('diario-teses-v873')||'[]');
      const hits=[];
      for(const t of (Array.isArray(ts)?ts:[])){
        if(!t||t.status!=='ativa'||!t.tk)continue;
        const c=cotacaoApp(t.tk),px=c?.px;if(!(px>0))continue;
        const ent=Number(t.entrada),alv=Number(t.alvo),stp=Number(t.stop);
        if(stp>0&&px<=stp)hits.push(t.tk+' atingiu stop/invalidação (R$ '+px.toFixed(2).replace('.',',')+')');
        else if(alv>0&&px>=alv)hits.push(t.tk+' atingiu preço-alvo (R$ '+px.toFixed(2).replace('.',',')+')');
        else if(ent>0&&px<=ent)hits.push(t.tk+' na zona de entrada (R$ '+px.toFixed(2).replace('.',',')+')');
      }
      if(hits.length)gatilhosLine='<p class="sm" style="margin:6px 0;padding:7px 9px;border-radius:8px;border:1px solid rgba(201,166,107,.55);background:rgba(201,166,107,.11)"><b>🎯 Gatilhos das suas Teses:</b> '+escape(hits.slice(0,3).join(' · '))+'</p>';
    }catch(_){}
    let alertasLine='';
    try{
      const als=typeof w.DiarioAlertasDisparados==='function'?w.DiarioAlertasDisparados():[];
      if(als.length)alertasLine='<p class="sm" style="margin:6px 0;padding:7px 9px;border-radius:8px;border:1px solid rgba(16,185,129,.55);background:rgba(16,185,129,.1)"><b>🔔 Alertas Disparados:</b> '+escape(als.slice(0,3).map(a=>a.tk+' ('+a.msg+')').join(' · '))+'</p>';
    }catch(_){}
    const mkGrp=(tit,arr)=>arr.length?'<div class="dt987-grp"><span class="dt987-gtit">'+tit+'</span><div class="dt987-chips">'+arr.map(x=>'<span class="dt987-pill '+(x.d1>0?'pos':x.d1<0?'neg':'')+'"><span>'+escape(x.n)+'</span><b>'+sinalNum(x.d1)+'</b></span>').join('')+'</div></div>':'';
    const doisMkts=(pulso.br.length||pulso.us.length||pulso.cripto.length)?'<div class="dt987-pulso">'+mkGrp('Brasil',pulso.br)+mkGrp('Exterior',pulso.us)+mkGrp('Cripto 24/7',pulso.cripto)+'</div>':'';
    const schwartzLine=agEvs.length?'<p class="sm" style="margin:4px 0"><b>S · Schwartz (Agenda BR/EUA):</b> '+escape(agEvs.join(' · '))+'</p>':'';
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
    const vel=state.falaVel||1;
    return '<div class="v810-intel-brief">'+pills+'<h3 style="margin:2px 0 4px">'+info.titulo+'</h3>'+relogio+
      riskBar+divLine+gatilhosLine+alertasLine+doisMkts+schwartzLine+
      '<p class="mut sm" style="margin:6px 0"><b>'+resumo+'</b> · '+fonte+' · '+(recent?'':'último reg. ')+when(state.mercado?.atualizadoEm)+'</p>'+
      (context?.warning?'<p class="mut sm">'+escape(context.warning)+'</p>':'')+
      '<div style="margin:10px 0 8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn s" data-aurea-resumao="'+ed+'"'+(state.resumaoBusy?' disabled aria-busy="true"':'')+'>'+(state.resumaoBusy?'Gerando resumão…':info.cta)+'</button>'+
      ('speechSynthesis' in w?'<button type="button" class="btn s" data-aurea-ouvir="'+ed+'">'+(state.falando?'⏹ Parar Rádio':'🎙️ Rádio do Pregão')+'</button><button type="button" class="btn s" data-aurea-vel="1" title="Velocidade da Rádio">'+vel+'x</button>':'')+
      '<button type="button" class="btn s" data-aurea-foco="1" style="'+(state.modoFoco?'border-color:#C9A66B;color:#C9A66B;font-weight:700':'')+'">'+(state.modoFoco?'🎯 Foco ON':'🎯 Modo Foco')+'</button></div>'+
      (state.resumaoEd===ed&&state.resumaoHtml?'<div data-aurea-resumo-gerado style="margin:12px 0 6px;padding-top:12px;border-top:1px solid rgba(201,166,107,.28)">'+state.resumaoHtml+'</div>':'')+
      (state.modoFoco?'':'<details><summary>Fatos publicados, hipóteses e fontes · '+mine.length+' ligados aos seus ativos</summary>'+
      '<ul class="v810-intel-events">'+top+'</ul>'+
      (hot.length?'<div><b>Hipóteses condicionadas</b></div>'+
        hot.slice(0,2).map(e=>'<p class="mut sm">'+tag('cenario')+escape(transmissao(e))+
        ' — cenário condicionado, não atribuição comprovada de causalidade.</p>').join(''):'')+
      '<p class="mut sm">'+escape(m.motivo)+'</p></details>'+memoriaPrevisao(context))+'</div>';
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
    if(w.DiarioPublico)return w.DiarioPublico.get(path,{signal,ttl:path==='/v1/mercado'?60000:path==='/v1/fluxo'?3600000:path==='/v1/analogia'||path==='/v1/extras'?900000:120000});
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
    if(!state.loadingMarket && now-state.marketAt>60000) {
      state.loadingMarket=true;
      Promise.all([request('/v1/mercado',signal),w.DiarioMarketData?.refresh?.()]).then(([data])=>{
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
    const antiBtn=event.target.closest('[data-aurea-antitilt]');
    if(antiBtn){
      const prompt='@munger Ative o protocolo Anti-Tilt de 30 segundos (inversão + Fear-Setting): estou em condição de alerta (cansaço de turno, sequência de stop ou janela de notícia). Me faça 3 perguntas curtas e diretas para eu decidir se reduzo a mão pela metade ou encerro o dia agora.';
      w.DiarioConselhoIA('antitilt', 'Checklist Anti-Tilt com Munger', prompt);
      return;
    }
    const velBtn=event.target.closest('[data-aurea-vel]');
    if(velBtn){
      const cur=state.falaVel||1;
      state.falaVel=cur===1?1.25:cur===1.25?1.5:1;
      repaint();
      return;
    }
    const focoBtn=event.target.closest('[data-aurea-foco]');
    if(focoBtn){
      state.modoFoco=!state.modoFoco;
      repaint();
      return;
    }
    const tagBtn=event.target.closest('[data-aurea-tag]');
    if(tagBtn){
      const raw=String(tagBtn.dataset.aureaTag||'');
      const sep=raw.indexOf('|');
      if(sep>0){
        const tid=raw.slice(0,sep),tg=raw.slice(sep+1);
        const map=getTagsMap();
        const arr=Array.isArray(map[tid])?map[tid]:[];
        const idx=arr.indexOf(tg);
        if(idx>=0)arr.splice(idx,1);else arr.push(tg);
        map[tid]=arr;
        try{localStorage.setItem('dt-tags-v924',JSON.stringify(map));}catch(_){}
        repaint();
      }
      return;
    }
    const pngBtn=event.target.closest('[data-aurea-cardpng]');
    if(pngBtn){
      try{
        const trs=((typeof S!=='undefined'&&Array.isArray(S?.trades))?S.trades:[]).filter(t=>t&&t.status!=='aberta');
        const pls=trs.map(t=>{let p=Number(t.r);if(!Number.isFinite(p)){try{p=Number(typeof cBRL==='function'?cBRL(t)?.pl:NaN)}catch(_){}}return p;}).filter(Number.isFinite).slice(-150);
        const n=pls.length||1,wins=pls.filter(x=>x>0),losses=pls.filter(x=>x<0);
        const wr=Math.round((wins.length/n)*100);
        const avgW=wins.length?wins.reduce((a,b)=>a+b,0)/wins.length:0;
        const avgL=losses.length?Math.abs(losses.reduce((a,b)=>a+b,0)/losses.length):0;
        const payoff=avgL>0?avgW/avgL:0;
        const expR=avgL>0?((wins.length/n)*payoff-(1-wins.length/n)):0;
        const cv=document.createElement('canvas');cv.width=1080;cv.height=1080;
        const ctx=cv.getContext('2d');
        const grd=ctx.createLinearGradient(0,0,1080,1080);
        grd.addColorStop(0,'#0B0D11');grd.addColorStop(1,'#151922');
        ctx.fillStyle=grd;ctx.fillRect(0,0,1080,1080);
        ctx.strokeStyle='rgba(201,166,107,0.45)';ctx.lineWidth=4;ctx.strokeRect(48,48,984,984);
        ctx.fillStyle='#C9A66B';ctx.font='700 32px Georgia, serif';ctx.fillText('DIÁRIO DE TRADER · MODO PRIVACIDADE',96,136);
        ctx.fillStyle='#9AA3B2';ctx.font='400 24px sans-serif';ctx.fillText('Evolução estatística (valores em R$ ocultos) · '+new Date().toLocaleDateString('pt-BR'),96,178);
        const cards=[
          ['TAXA DE ACERTO',wr+'%'],
          ['PAYOFF MÉDIO',payoff.toFixed(2).replace('.',',')+'x'],
          ['EXPECTATIVA (EM R)',(expR>=0?'+':'')+expR.toFixed(2).replace('.',',')+'R'],
          ['OPERAÇÕES ANALISADAS',String(pls.length)]
        ];
        cards.forEach((c,i)=>{
          const col=i%2,row=Math.floor(i/2),x=96+col*460,y=260+row*260;
          ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fillRect(x,y,428,210);
          ctx.strokeStyle='rgba(201,166,107,0.28)';ctx.lineWidth=2;ctx.strokeRect(x,y,428,210);
          ctx.fillStyle='#9AA3B2';ctx.font='600 22px sans-serif';ctx.fillText(c[0],x+32,y+64);
          ctx.fillStyle='#F4F1EA';ctx.font='700 68px Georgia, serif';ctx.fillText(c[1],x+32,y+154);
        });
        const pil=pilulaDia();
        ctx.fillStyle='#C9A66B';ctx.font='700 24px sans-serif';ctx.fillText('✦ '+pil[0],96,840);
        ctx.fillStyle='#D4D8E0';ctx.font='400 24px sans-serif';
        const words=pil[1].split(' ');let line='',ly=884;
        for(const wd of words){
          if(ctx.measureText(line+wd).width>880){ctx.fillText(line,96,ly);line=wd+' ';ly+=34;}
          else line+=wd+' ';
        }
        if(line)ctx.fillText(line,96,ly);
        const a=document.createElement('a');
        a.download='diario-evolucao-'+new Date().toISOString().slice(0,10)+'.png';
        a.href=cv.toDataURL('image/png');
        a.click();
      }catch(_){}
      return;
    }
    const ouvBtn=event.target.closest('[data-aurea-ouvir]');
    if(ouvBtn&&'speechSynthesis' in w){
      if(state.falando){try{w.speechSynthesis.cancel();}catch(_){}state.falando=false;repaint();return;}
      const ed=ouvBtn.dataset.aureaOuvir||'manha';
      const futUS=futurosEuaStatus();
      const nomes={
        fimdesemana:futUS.aberto?'Edição de fim de semana. Os futuros americanos na CME já estão abertos, enquanto a B3 e o mercado à vista de Nova York seguem fechados.':'Edição de fim de semana. B3 e Wall Street estão fechados.',
        manha:'Edição da manhã, pré-abertura.',
        meiodia:'Edição do meio-dia, B3 e Estados Unidos em pregão.',
        fechamento:'Edição de fechamento.'
      };
      const p=pulsoDoisMercados(),m=mercadoPlan(),pil=pilulaDia();
      const hojeIso=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
      const agEvs=(state.agenda?.eventos||[]).filter(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&e.em&&new Date(e.em).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})>=hojeIso)
        .slice(0,2).map(e=>new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' '+String(e.t||'').slice(0,45)).join('. ');
      let alsTxt='';
      try{const als=typeof w.DiarioAlertasDisparados==='function'?w.DiarioAlertasDisparados():[];if(als.length)alsTxt='Alertas disparados: '+als.slice(0,2).map(a=>a.tk+' '+a.msg).join('. ')+'. ';}catch(_){}
      const topNews=timeline().filter(e=>e.prioridade==='alta').slice(0,2).map(e=>tit(e)).join('. ');
      const fala='Rádio do Pregão, com a Áurea. '+(nomes[ed]||'')+' '+
        (p.riskLabel?'Humor global agora: '+p.riskLabel+'. ':'')+
        (p.texto?p.texto.replace(/\|/g,'. ').replace(/·/g,', ')+'. ':'')+
        (m.nome&&!/insuficiente|Sem leitura/i.test(m.nome)?'Leitura atual: '+m.nome+'. ':'')+
        (agEvs?'Agenda crítica: '+agEvs+'. ':'')+
        alsTxt+
        (topNews?'Destaques nas notícias: '+topNews+'. ':'')+
        'Pílula do Cérebro de hoje, '+pil[0]+': '+pil[1];
      try{
        w.speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(fala);
        u.lang='pt-BR';u.rate=state.falaVel||1;
        u.onend=u.onerror=()=>{state.falando=false;repaint();};
        state.falando=true;repaint();
        w.speechSynthesis.speak(u);
      }catch(_){state.falando=false;repaint();}
      return;
    }
    const edBtn=event.target.closest('[data-aurea-edicao]');
    if(edBtn){
      state.edicaoManual=edBtn.dataset.aureaEdicao||'';
      repaint();
      return;
    }
    const resBtn=event.target.closest('[data-aurea-resumao]');
    if(resBtn){
      if(state.resumaoBusy)return;
      event.preventDefault();
      const ed=resBtn.dataset.aureaResumao||'manha';
      const futUS=futurosEuaStatus();
      const nomes={
        fimdesemana:futUS.aberto?'Edição de Fim de Semana · Futuros EUA (CME) Abertos':'Edição de Fim de Semana (Preparação da Semana)',
        manha:'Edição da Manhã (Pré-abertura)',
        meiodia:'Edição do Meio-dia (Meio do pregão)',
        fechamento:'Edição de Fechamento (Pós-pregão)'
      };
      const c=w.DiarioSessoes?.context(),p=pulsoDoisMercados(),m=mercadoPlan(),adrTxt=resumoParidadeAdrs();
      const {domingo,fimdesemana,b3Fechada}=contextoResumao956(c);
      const horaSP=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});
      const horaNY=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/New_York'});
      const hojeIso=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
      const agAlvo=(ed==='fechamento'||ed==='fimdesemana')&&c?.b3?.nextDate?c.b3.nextDate:hojeIso;
      const agEvs=(state.agenda?.eventos||[]).filter(e=>e&&e.imp>=1&&/^(BR|US)$/.test(e.p)&&e.em&&new Date(e.em).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})>=agAlvo)
        .slice(0,5).map(e=>new Date(e.em).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'America/Sao_Paulo'})+' '+new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' ['+e.p+'] '+String(e.t||'').slice(0,55));
      const meus=(meusAtivos()||[]).slice(0,8);
      const topNews=timeline().filter(e=>e.prioridade==='alta').slice(0,3).map(e=>tit(e)).join(' | ');
      const prompt='@schwartz Monte o resumão executivo detalhado da Áurea — '+(nomes[ed]||ed)+
        ' (data: '+hojeIso+'; agora: '+horaSP+' Brasília / '+horaNY+' Nova York). '+
        'Status dos mercados agora: B3='+(c?.b3?.state||'—')+', NYSE/Nasdaq à vista='+(c?.us?.state||'—')+', Futuros EUA (CME Globex: ES/NQ/YM/Ouro/Petróleo)='+futUS.label+'. '+
        (b3Fechada?'IMPORTANTE: o mercado à vista da B3 está fechado agora; em dias de pregão, WIN/WDO normalmente abrem às 09:00 e à vista às 10:00 Brasília. Respeite a fase atual dos futuros locais. NÃO diga que IBOV/WIN estão "com dados indisponíveis": explique que o pregão local está fechado e use o EWZ, as ADRs brasileiras (PBR, VALE, ITUB, BBD) e o USD/BRL abaixo para projetar uma possível abertura aqui. ':'')+
        (futUS.aberto&&domingo?'IMPORTANTE: os Futuros EUA na CME Globex já estão abertos; considere os futuros e cripto 24/7, com atenção à liquidez menor da sessão de domingo. ':'')+
        (p.riskLabel?'Humor Global: '+p.riskLabel+' ('+p.riskScore+'). ':'')+
        (p.divergencia?'Divergência detectada: '+p.divergencia+' ':'')+
        (p.texto?'Cotações no painel: '+p.texto+'. Use apenas estes valores observados; não substitua por outros preços nem trate ausência como zero. ':'')+
        (adrTxt?'Termômetro externo de Brasil (EWZ e Paridade de ADRs): '+adrTxt+'. ':'')+
        (m.nome?'Leitura de amplitude: '+m.nome+'. ':'')+
        (agEvs.length?'Agenda alto impacto BR/EUA: '+agEvs.join(' · ')+'. ':'')+
        (meus.length?'Ativos acompanhados pelo trader: '+meus.join(', ')+'. ':'')+
        (topNews?'Principais manchetes: '+topNews+'. ':'')+
        'Traga detalhes práticos e objetivos em 4 blocos: '+
        '1) Exterior, Futuros EUA e Cripto (humor de risco, principais vetores em índices/commodities/cripto'+(domingo?' e cuidado com liquidez baixa de domingo':'')+'), '+
        '2) Impacto no Brasil (IBOV, WIN, WDO e Juros — se B3 fechada, cite EWZ e ADRs como PBR/VALE/ITUB/BBD para estimar a direção provável da abertura), '+
        '3) Agenda Crítica BR/EUA (quais horários e dados podem virar o pregão), '+
        '4) Plano Prático e Riscos (o que observar na abertura, pontos de atenção em WIN/WDO e nos ativos acompanhados).';
      // v904: a resposta volta à tela pela Cloudflare, nunca pela função analise do Supabase.
      // Indisponibilidade do provedor gratuito apresenta um resumo LOCAL identificado.
      state.resumaoBusy=true;
      state.resumaoEd=ed;
      state.resumaoHtml='';
      repaint();
      try{
        if(typeof tok==='function')await tok(); // Apenas renovação de login, permitida.
        const jwt=typeof SESS!=='undefined'?String(SESS?.at||''):'';
        if(jwt.length<40)throw Error('Faça login para usar a IA gratuita.');
        const res=await w.fetch('https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/aurea-resumao',{
          method:'POST',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',
          headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:'Bearer '+jwt},
          body:JSON.stringify({edicao:ed,prompt:prompt.slice(0,6000)}),
          signal:AbortSignal.timeout(34000)
        });
        const j=await res.json().catch(()=>({}));
        if(!res.ok||!j.ok||!j.text)throw Error(j.error||'A IA não conseguiu gerar o texto agora.');
        state.resumaoHtml='<div style="margin-bottom:10px;font-size:12.5px;color:var(--gold,#C9A66B);font-weight:700;letter-spacing:.02em">✦ RESUMÃO DA ÁUREA · IA GRATUITA ('+escape(j.model||'Cloudflare')+')</div>'+
          formatarTextoEditorial(j.text);
      }catch(err){
        const stale=state.mercado?.atualizadoEm?'Último registro: '+when(state.mercado.atualizadoEm)+'.':'Sem carimbo de atualização.';
        const riskExpl=p.riskScore==null?'Sem leitura consolidada de apetite a risco.':
          p.riskScore>=25?'Ambiente de **Apetite a Risco (Risk-On, +'+p.riskScore+')**: bolsas e ativos de risco tendem a receber fluxo comprador, mas fique atento a realizações em pontos de resistência.':
          p.riskScore<=-25?'Ambiente de **Aversão a Risco (Risk-Off, '+p.riskScore+')**: capital migra para proteção (dólar/ouro/Treasuries), exigindo mão reduzida em compras no Brasil.':
          'Ambiente **Neutro/Misto ('+(p.riskScore>0?'+':'')+p.riskScore+')**: mercado sem direção única global — prefira operações seletivas nos seus melhores níveis.';
        let alsTxt='';
        try{const als=typeof w.DiarioAlertasDisparados==='function'?w.DiarioAlertasDisparados():[];if(als.length)alsTxt=' **Alertas disparados agora:** '+als.slice(0,3).map(a=>a.tk+' ('+a.msg+')').join(' · ')+'.';}catch(_){}
        const blocos=[
          '1) Exterior, Futuros EUA e Cripto\nStatus CME Globex: **'+futUS.label+'**. '+riskExpl+(p.texto?'\nCotações capturadas: '+p.texto+'.':''),
          '2) Impacto no Brasil (IBOV, WIN, WDO e Juros)\n'+(b3Fechada?'Mercado à vista da B3 fechado neste horário. Em dias de pregão, WIN/WDO normalmente às 09:00 e à vista às 10:00. ':'')+(adrTxt?'Termômetro por EWZ e ADRs: **'+adrTxt+'**. ':'')+(m.nome&&!/insuficiente|Sem leitura/i.test(m.nome)?'Amplitude: **'+m.nome+'**. ':'')+(p.divergencia?'\n'+p.divergencia:'Quando exterior, ADRs e câmbio apontam na mesma direção, o fluxo tende a ser mais limpo na abertura.'),
          '3) Agenda Crítica BR/EUA\n'+(agEvs.length?agEvs.map(x=>'• '+x).join('\n'):'Nenhum evento de alto impacto nos próximos horários. Acompanhe o fluxo técnico e as manchetes corporativas.'),
          '4) Plano Prático e Riscos\nEvite abrir posição nos 10 minutos anteriores a dados de alto impacto.'+alsTxt+(meus.length?' Ativos no seu radar: **'+meus.slice(0,6).join(', ')+'**.':'')
        ];
        state.resumaoHtml='<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:700;color:var(--gold,#C9A66B)">✦ Resumão Local · Leitura Direta dos Dados</div>'+
          '<div class="mut sm" style="margin-top:2px">'+escape(String(err?.message||'IA indisponível').slice(0,140))+' · '+escape(stale)+'</div></div>'+
          formatarTextoEditorial(blocos.join('\n\n'));
      }finally{
        state.resumaoBusy=false;
        repaint();
      }
      return;
    }
    const revBtn=event.target.closest('[data-aurea-revisao]');
    if(revBtn&&!state.revisaoBusy){
      const st14=analiseTradesRecentes();
      if(!st14)return;
      const resumo='Últimos 14 dias: '+st14.n+' trades encerrados. '+
        (st14.mTaxa!=null?'Acerto manhã (<12h): '+st14.mTaxa+'% ('+st14.mN+' trades). ':'')+
        (st14.tTaxa!=null?'Acerto tarde (>=12h): '+st14.tTaxa+'% ('+st14.tN+' trades). ':'')+
        (st14.melhor?'Melhor ativo: '+st14.melhor[0]+'. ':'')+
        (st14.pior&&st14.pior[1]<0?'Pior ativo: '+st14.pior[0]+'. ':'')+
        (st14.semStop?st14.semStop+' trade(s) sem stop registrado.':'Todos os trades com stop registrado.');
      if(!w.DiarioCerebroIA?.api){
        w.TraderChat?.open?.();
        if(typeof ecoPergunta==='function')void ecoPergunta('@dow Faça uma revisão pós-pregão dos meus padrões: '+resumo,{pergunta:'✦ Revisão pós-pregão da Áurea'});
        return;
      }
      state.revisaoBusy=true;state.revisaoOut='';repaint();
      try{
        const j=await w.DiarioCerebroIA.api({acao:'gerar',modo:'aula_erro',tema:'gestao de risco psicologia disciplina overtrading stop',extra:'ERRO / PADRÃO DO DIÁRIO: '+resumo});
        const r=j&&j.resultado||{};
        const passos=Array.isArray(r.o_que_fazer)&&r.o_que_fazer.length?'<ul style="margin:4px 0;padding-left:16px">'+r.o_que_fazer.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>':'';
        state.revisaoOut='<b>'+escape(r.titulo||'Revisão da Áurea')+'</b>'+
          (r.por_que_acontece?'<p style="margin:4px 0">'+escape(r.por_que_acontece)+'</p>':'')+
          passos+
          (r.exercicio?'<p style="margin:4px 0"><b>Exercício prático:</b> '+escape(r.exercicio)+'</p>':'')+
          (r.fonte?'<p class="mut sm" style="margin:4px 0">Fonte do seu Cérebro: '+escape(r.fonte)+'</p>':'');
      }catch(err){
        state.revisaoOut='<span class="mut">Não foi possível consultar o Cérebro agora ('+escape(err?.message||'erro')+').</span>';
      }finally{state.revisaoBusy=false;repaint();}
      return;
    }
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
  /* v852: manchetes recentes ligadas a um ativo (texto puro, para a explicação da IA na ficha). */
  function noticiasDo(tk){const t=String(tk||'').toUpperCase(),base=t.replace(/\d+$/,'');return timeline().filter(e=>(e.relacoes?.diretos||[]).includes(t)||ligar(e).some(l=>l.tk===t&&l.tipo!=='hipotese')||new RegExp('\\b'+base,'i').test(String(e.titulo||''))).slice(0,6).map(e=>when(e.ultimaAtualizacao)+' · '+tit(e))}
  w.DiarioInteligenciaEtapa1=Object.freeze({montar:mount,porQue,noticiasDo,sentimento,minha,pontosDoDia,meusAtivos,mercadoPlan,relacionados,todosEventos:timeline,refresh,inspect:()=>({route:state.route,newsAt:state.newsAt,marketAt:state.marketAt})});
  mount();
})(window);
