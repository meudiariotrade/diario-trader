/* v287: uma fonte para EWZ/ADRs, Monitor válido e captura com referência explícita. */
(() => {
  'use strict';
  const safe=v=>esc(String(v??'')),time=v=>v?new Date(v).toLocaleString('pt-BR'):'não informada';
  const visible=()=>!document.hidden&&(tab==='home'&&!!document.getElementById('adr')&&document.getElementById('adr').getClientRects().length>0||tab==='mercado'&&MKT.tab==='cq'&&CQ.aba==='adr');
  let adrJob=null,quoteJob=null;
  const age=()=>AD.data?.ts?Date.now()-AD.data.ts:Infinity;
  const stale=()=>age()>5*60000;
  const originalAdrHtml=adrHtml;
  adrHtml=function(){
    let html=originalAdrHtml.apply(this,arguments).replace(/atualizado às /g,'consultado às ').replace(', sem atraso',', atraso não confirmado');
    const missing=AD.list.filter(t=>!(AD.data?.itens||[]).some(item=>item.s===t));
    return `<div class="monitor-reference" role="status"><b>EWZ e ADRs brasileiras</b><span>${AD.busy?'Consultando…':AD.err?'Falha na atualização':!AD.data?'Sem consulta concluída':stale()?'Cópia antiga · confira a referência':'Consulta recente · preço pode ter atraso'}</span><small>Consulta concluída: ${safe(time(AD.data?.ts))}. Horário individual das cotações não fornecido por esta fonte. Fechamento fora do pregão pode ser o último disponível.</small></div>`+html+(missing.length?`<p class="sm mut">Sem cotação nesta consulta: ${safe(missing.join(', '))}.</p>`:'')+`<p class="sm mut">Esta é a mesma lista usada na imagem do panorama. O EWZ é um ETF e fica separado da média das ADRs.</p>`;
  };
  adrLoad=function(force=false){
    if(adrJob)return adrJob;
    const ttl=adState(AD.data?.itens||[])==='closed'?300000:50000;
    if(!force&&AD.data&&age()<ttl)return Promise.resolve(true);
    if(window.DIARIO_DEMO)return Promise.resolve(false);
    if(!SESS?.at){AD.err='Entre na sua conta para atualizar as cotações. A cópia anterior, se houver, continua identificada.';adrPaint();return Promise.resolve(false)}
    const symbols=AD.list.slice();
    AD.busy=1;AD.err='';adrPaint();
    adrJob=(async()=>{
      try{
        const response=await rq('/functions/v1/adrs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbols}),signal:AbortSignal.timeout(25000)});
        const data=await response.json();if(!Array.isArray(data.itens)||!data.itens.length)throw Error(data.error||'A fonte não retornou cotações válidas.');
        if(symbols.join(',')!==AD.list.join(','))return false;
        const items=data.itens.filter(item=>symbols.includes(item.s)&&typeof item.px==='number'&&Number.isFinite(item.px));
        if(!items.length)throw Error('Nenhuma cotação válida na resposta.');
        AD.data={ts:Date.now(),itens:items,fonte:data.fonte||'Fonte não informada',atraso:!!data.atraso};ls.set('diario-adr-d',AD.data);
        const missing=symbols.filter(t=>!items.some(item=>item.s===t));AD.err=[missing.length?'Sem dados de: '+missing.join(', ')+'.':'',data.aviso||''].filter(Boolean).join(' ');return true;
      }catch(error){AD.err=String(error.message||error);return false}
      finally{AD.busy=0;adrJob=null;adrPaint();paintHomeQuote()}
    })();return adrJob;
  };
  // Substitui o timer antigo, que só aceitava a tela Início.
  adrAfter=function(){if(visible())adrLoad(false);if(!AD.tm)AD.tm=setInterval(()=>{if(visible())adrLoad(false)},30000)};
  if(AD.tm){clearInterval(AD.tm);AD.tm=null}
  const originalCot=cotHtml;
  const categoryTabs=()=>`<div class="seg cqtabs" role="navigation" aria-label="Classes de ativos">${CQ_ABAS.map(([id,label])=>`<button type="button" data-cqa="${id}" class="${CQ.aba===id?'on':''}"${CQ.aba===id?' aria-current="page"':''}>${id==='adr'?'EWZ e ADRs':safe(label)}</button>`).join('')}</div>`;
  cotHtml=function(){return CQ.aba==='adr'?`<div id="cqbox">${categoryTabs()}<section id="adr" class="card">${adrHtml()}</section></div>`:originalCot.apply(this,arguments)};
  const originalQuoteLoad=cqCarrega;
  cqCarrega=function(category,force){return (category||CQ.aba)==='adr'?adrLoad(!!force):originalQuoteLoad.apply(this,arguments)};
  if(!ls.get('diario-cq-aba'))CQ.aba='adr';
  const originalMarket=vMercado;
  vMercado=function(){
    if(MKT.tab==='cot')MKT.tab='cq';
    if(MKT.tab==='cq'){setTimeout(()=>{cqCarrega(CQ.aba);adrAfter()},0);return `<section class="market-monitor"><h2>Monitor de cotações</h2><p class="mut sm">Acompanhe as classes abaixo. EWZ e ADRs usam a lista da imagem do panorama.</p>${cotHtml()}</section>`}
    return originalMarket.apply(this,arguments);
  };
  const originalMdo=mdoCarrega;
  mdoCarrega=function(force){if(quoteJob)return quoteJob;quoteJob=Promise.resolve(originalMdo.apply(this,arguments)).finally(()=>{quoteJob=null});return quoteJob};
  // A captura consulta as duas fontes mesmo que o card do Início esteja oculto.
  imgDados=async function(){
    if(window.DIARIO_DEMO)throw Error('A captura de mercado exige dados reais; consultas externas estão desativadas na demonstração.');
    if(!SESS?.at)throw Error('Entre na conta para atualizar o panorama e a lista de ADRs antes de gerar a imagem.');
    const support=async()=>{const jobs=[];try{if(typeof balCarrega==='function')jobs.push(Promise.race([balCarrega(),new Promise(resolve=>setTimeout(resolve,4000))]))}catch{}try{if(typeof AG!=='undefined'&&(!AG.v[0]||Date.now()-(AG.ts[0]||0)>1800000)){const previous=AG.sem;AG.sem=0;let request;try{request=agCarrega(true)}finally{AG.sem=previous}jobs.push(Promise.race([request,new Promise(resolve=>setTimeout(resolve,4000))]))}}catch{}await Promise.allSettled(jobs)};
    const results=await Promise.allSettled([mdoCarrega(true),adrLoad(true),support()]);
    const oldMacro=!MDO.ts||Date.now()-MDO.ts>300000,problems=[];
    if(results[0].status==='rejected'||MDO.err||oldMacro)problems.push('Panorama: '+(MDO.err||'não foi possível confirmar uma consulta recente.'));
    if(results[1].status==='rejected'||results[1].value!==true||AD.err||stale())problems.push('EWZ/ADRs: '+(AD.err||'não foi possível confirmar uma consulta recente.'));
    IMG.marketReference={macro:MDO.ts||null,adrs:AD.data?.ts||null,warning:problems.join(' ')};
    if(problems.length&&!confirm(problems.join('\n')+'\n\nGerar usando os dados disponíveis, com o aviso de falha/consulta anterior na imagem?'))throw Error('Captura cancelada; atualize as fontes e tente novamente.');
  };
  const originalCanvas=imgDesenha;
  imgDesenha=function(){
    const source=originalCanvas.apply(this,arguments),canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height+160;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);ctx.fillStyle='#eef2f1';ctx.fillRect(0,source.height,canvas.width,160);ctx.textAlign='left';ctx.textBaseline='top';ctx.font='22px system-ui';ctx.fillStyle='#334155';
    const ref=IMG.marketReference||{macro:MDO.ts,adrs:AD.data?.ts},lines=[`Consulta do panorama: ${time(ref.macro)}`,`Consulta de EWZ/ADRs: ${time(ref.adrs)}`,ref.warning?'ATENÇÃO: atualização com falha ou dados parciais; confira as referências.':'Consulta recente não garante cotação em tempo real.', 'Preço pode ter atraso; fora do pregão pode ser o último fechamento.'];
    lines.forEach((line,index)=>ctx.fillText(line,42,source.height+16+index*32,canvas.width-84));return canvas;
  };
  function homeQuote(){
    const ewz=AD.data?.itens?.find(row=>row.s==='EWZ');
    return `<div class="top"><div><b>EWZ e ADRs brasileiras</b><p class="sm mut">${ewz?'EWZ '+safe(adN(ewz.px))+' · '+safe(adP(ewz.chp)):'Sua lista de acompanhamento está no Monitor.'}</p></div><button type="button" class="btn s" data-market-adrs>Abrir lista</button></div><small class="mut">Consulta: ${safe(time(AD.data?.ts))}${stale()?' · cópia antiga':''}. Mesma lista usada na imagem do panorama.</small>`;
  }
  function paintHomeQuote(){const node=document.getElementById('market-watch-shortcut');if(node)node.innerHTML=homeQuote()}
  function decorate(){
    if(MKT.tab==='cot'){MKT.tab='cq';ls.set('diario-mkt-tab','cq')}
    const root=document.getElementById('app');if(!root)return;
    const market=tab==='mercado'||['juros','live','graf'].includes(tab);
    if(market){root.querySelectorAll('.trvolta').forEach(node=>node.remove());root.classList.add('market-workspace');}
    else root.classList.remove('market-workspace');
    if((tab==='home'||tab==='mercado'&&MKT.tab==='mu')&&!root.querySelector('#market-watch-shortcut')){
      const node=document.createElement('section');node.id='market-watch-shortcut';node.className='card market-watch-shortcut';node.innerHTML=homeQuote();
      const anchor=root.querySelector('.routine-card,.workbench-header');if(anchor)anchor.after(node);else root.prepend(node);
    }
    if(tab==='home')root.querySelectorAll('[data-hb="adr"]').forEach(node=>node.remove());
    if(tab==='mercado'&&MKT.tab==='cq'&&CQ.aba==='adr')adrAfter();
    root.querySelectorAll('.pro-tabs [aria-current="page"],.pro-subtabs [aria-current="page"]').forEach(node=>{const nav=node.parentElement;if(nav.scrollWidth>nav.clientWidth)node.scrollIntoView({inline:'nearest',block:'nearest'})});
  }
  window.TraderUI.onRender('mercado-monitor',decorate);
  window.addEventListener('click',event=>{
    if(event.target.closest('[data-market-chat]')){event.preventDefault();event.stopImmediatePropagation();window.TraderChat?.open();return}
    if(event.target.closest('[data-market-adrs]')){event.preventDefault();event.stopImmediatePropagation();CQ.aba='adr';ls.set('diario-cq-aba','adr');window.DIARIO_NAV.navigate('mercado:cq')}
  },true);
  document.addEventListener('visibilitychange',()=>{if(visible())adrLoad(false)});
  window.TraderMarket={decorate,visible,stale,refresh:()=>adrLoad(true)};
})();
