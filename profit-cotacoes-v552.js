/* v552 — com a ponte ao vivo, as cotações da B3 vêm do Profit.
   A ponte publica os contratos como WINFUT/WDOFUT/INDFUT/DOLFUT; a versão anterior só aceitava WINZ26 etc. */
(function (root, doc) {
  'use strict';
  if (root.ProfitCotacoes552 || typeof cqPonte !== 'function') return;
  const FUT = /^(WIN|WDO|IND|DOL)(?:FUT|[FGHJKMNQUVXZ]\d\d|\$N?)$/;
  const g = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch { return d; } };
  // v945: a data de atualização da ponte não substitui a hora do último negócio.
  // O Profit pode republicar o fechamento horas depois sem novo trade.
  const horarioNegocio = row => {
    const data = String(row?.dat || '').trim();
    const hora = String(row?.hor || '').trim();
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
    const hm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(hora);
    if (!match || !hm) return null;
    const [,dia,mes,ano] = match;
    const time = ano+'-'+mes+'-'+dia+'T'+hm[1]+':'+hm[2]+':'+(hm[3] || '00')+'-03:00';
    const n = Date.parse(time);
    return Number.isFinite(n) && n <= Date.now()+60000 &&
      new Date(n).toLocaleDateString('en-GB',{timeZone:'America/Sao_Paulo'}) ===
      dia+'/'+mes+'/'+ano ? new Date(n).toISOString() : null;
  };
  const EDGE='https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/profit-quotes';
  let edgePending=null;
  // O wrapper nunca volta ao polling antigo do Supabase após falha local.
  cqPonte = async function (force = false) {
    try {
      if (typeof SESS === 'undefined' || !SESS?.uid) { CQ.pf={}; CQ.saved={}; CQ.owner=null; return; }
      if (CQ.owner !== SESS.uid) { CQ.pf={}; CQ.saved={}; CQ.pfTs=0; CQ.cloudTs=0; CQ.edgeTs=0; CQ.edgeOk=false; CQ.edgeOwner=null; CQ.owner=SESS.uid; }
      const configured = root.DIARIO_PONTE_LOCAL?.cotacoesUrl || '';
      // v945: consultas automáticas ao Supabase seguem a cada 15min.
      // Ação explícita de Atualizar pode revalidar antes, limitada a uma vez a cada 15s.
      const manual = force === true;
      const owner = SESS.uid;
      let linhas = null, edge=false;
      // Apenas o canal privado Cloudflare é consultado em segundos. A sessão já existente é reutilizada.
      if (SESS.at && !root.DIARIO_DEMO && Date.now()-(CQ.edgeTs||0)>=(CQ.edgeOk?5000:30000)) {
        if(edgePending) return;
        const controller=new AbortController();edgePending=controller;CQ.edgeTs=Date.now();
        try {
          if(typeof tok==='function'&&Number(SESS.exp)-Date.now()<60000)await tok();
          if(SESS?.uid!==owner||controller.signal.aborted)return;
          const response=await fetch(EDGE,{headers:{Authorization:'Bearer '+SESS.at},credentials:'omit',cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(3500)])});
          if(response.ok){
            const result=await response.json(), age=Date.now()-Date.parse(result.received_at);
            if(result.ok===true&&Array.isArray(result.cotacoes)&&result.cotacoes.length&&age>=-60000&&age<=45000){linhas=result.cotacoes;edge=true}
          }
          if(SESS?.uid===owner)CQ.edgeOk=edge;
        }catch{if(controller.signal.aborted)return;if(SESS?.uid===owner)CQ.edgeOk=false}
        finally{if(edgePending===controller)edgePending=null}
      }
      if(SESS?.uid!==owner)return;
      if(!edge && Date.now() - (CQ.pfTs || 0) < (manual || configured ? 15e3 : 15 * 6e4)) return;
      CQ.pfTs = Date.now();
      if (!edge && configured) {
        try {
          const url = new URL(configured);
          if (url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname)) {
            const response = await fetch(url.href,{signal:AbortSignal.timeout(4000),cache:'no-store',credentials:'omit'});
            if (response.ok) { const result = await response.json(); linhas = Array.isArray(result) ? result : result.cotacoes; }
          }
        } catch { /* servidor local indisponível; último fechamento permanece disponível */ }
      }
      // Apenas snapshot de reserva: no máximo uma consulta a cada 15 minutos, nunca por segundo.
      if (!Array.isArray(linhas)) {
        if (Date.now() - (CQ.cloudTs || 0) < (manual ? 15e3 : 15 * 6e4)) return;
        CQ.cloudTs = Date.now();
        linhas = await (await rq('/rest/v1/cotacoes?select=ticker,ult,var,updated_at,dat,hor&limit=250&user_id=eq.' + SESS.uid,{signal:AbortSignal.timeout(4000)})).json();
      }
      if (SESS?.uid !== owner || !Array.isArray(linhas)) return;
      const t = {}, saved = {}, vig = { WIN: codFut('WIN'), WDO: codFut('WDO'), IND: codFut('IND'), DOL: codFut('DOL') };
      (linhas || []).forEach(o => {
        const s = String(o.ticker || '').toUpperCase();
        if (!(+o.ult > 0) || !Number.isFinite(Date.parse(o.updated_at)) || Date.parse(o.updated_at) > Date.now()+60000) return;
        const real=horarioNegocio(o);
        if(edge&&!real)return;
        const negociadoEm = real || o.updated_at;
        const n = { px: +o.ult, d1: o.var != null && isFinite(+o.var) ? +o.var : null,
          tk: s, em: negociadoEm, recebidoEm: o.updated_at };
        const older = saved[s];
        if (!older || Date.parse(n.em) > Date.parse(older.em)) saved[s] = n;
        const stale = Date.now() - Date.parse(n.em) > 3 * 6e4;
        if (!stale) t[s] = n;
        const r = FUT.exec(s);
        // Contrato vigente tem prioridade; depois o contínuo (WINFUT); depois qualquer outro.
        if (r) {
          const k = '@' + r[1];
          // Never use an expired contract as the generic current future.
          if (s !== vig[r[1]] && !/FUT$/.test(s)) return;
          for (const target of stale ? [saved] : [saved,t]) {
            const current = target[k];
            if (!current || (s === vig[r[1]] && current.tk !== vig[r[1]]) || (s === current.tk && Date.parse(n.em)>Date.parse(current.em))) target[k] = n;
          }
        }
      });
      // A reserva nunca apaga um negócio do canal de borda comprovadamente mais novo.
      if(!edge&&CQ.edgeOwner===owner){
        for(const [s,n] of Object.entries(CQ.saved||{})){
          if(Date.parse(n.em)>(Date.parse(saved[s]?.em)||0)){
            saved[s]=n;if(Date.now()-Date.parse(n.em)<=3*6e4)t[s]=n;else delete t[s];
          }
        }
      }
      if(edge)CQ.edgeOwner=owner;
      CQ.pf = t; CQ.saved = saved;
      // v946: notifica consumidores em memória (Research/Terminal) apenas após
      // snapshot válido; sem criar novas consultas, polling ou divulgar preços.
      if (typeof doc.dispatchEvent === 'function' && typeof root.CustomEvent === 'function')
        doc.dispatchEvent(new root.CustomEvent('diario:profit-cotacoes',{
          detail:{uid:owner,aoVivo:Object.keys(t).length,fechamento:Object.keys(saved).length}
        }));
    } catch { return; /* falha da ponte não religa consultas rápidas do legado */ }
  };
  // Ação humana no botão Atualizar, sem criar polling rápido no Supabase.
  doc.addEventListener('click', event => {
    if (!event.target?.closest?.('[data-cqr]')) return;
    Promise.resolve().then(() => cqPonte(true)).then(() => cqPinta()).catch(() => {});
  });
  // Ciclo de vida: timer só com uma tela consumidora visível, encerrado na saída.
  let tickerTimer=null,tickBusy=false;
  const market=()=>g(()=>tab,'')==='mercado'&&g(()=>MKT.tab,'')==='cq';
  const active=()=>!doc.hidden&&!!g(()=>SESS?.uid,null)&&(market()||g(()=>tab,'')==='live'||g(()=>tab,'')==='terminal'||!!doc.getElementById?.('ap-root'));
  async function tick(){
    if(tickBusy||!active())return;
    tickBusy=true;
    try{
      const antes=g(()=>CQ.pfTs,0);await cqPonte();
      if(!active()||!market()||g(()=>CQ.pfTs,0)===antes||doc.activeElement?.matches?.('#cotbox input, #cqbox input'))return;
      cqPinta();
    }catch{}finally{tickBusy=false}
  }
  function ciclo(){
    if(!active()){
      if(tickerTimer!==null){clearInterval(tickerTimer);tickerTimer=null}
      if(edgePending)edgePending.abort();
      return;
    }
    if(tickerTimer===null){tickerTimer=setInterval(tick,5000);void tick()}
  }
  doc.addEventListener('visibilitychange',ciclo);
  doc.addEventListener('diario:tela',()=>requestAnimationFrame(ciclo));
  // Linha de fonte curta no lugar do parágrafo longo.
  function fonte() {
    const box = doc.querySelector('#app:not(.v503-fantasma) #cotbox'); if (!box || box.classList.contains('market-quotes')) return;
    const p = [...box.querySelectorAll(':scope > div.sm.mut')].find(d => /^Fonte:/.test(d.textContent.trim()));
    if (!p) return;
    const vivo = Object.keys(g(() => CQ.pf, {}) || {}).length > 0;
    const txt = vivo ? 'Preços da B3 ao vivo pelo Profit. Exterior, moedas e cripto pelo TradingView.' : 'Ponte do Profit desligada: preços do TradingView, B3 com até 15 min de atraso.';
    p.classList.add('m552-fonte', 'v552-fonte');
    if (p.textContent !== txt) p.textContent = txt;
  }
  let q = false;
  new MutationObserver(() => { if (!q) { q = true; requestAnimationFrame(() => { q = false; fonte(); ciclo(); }); } }).observe(doc.body, { childList: true, subtree: true });
  root.ProfitCotacoes552 = Object.freeze({ FUT });
  ciclo();
})(window, document);
