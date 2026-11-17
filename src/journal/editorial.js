/* v714: mesma edição e mesmas referências na tela e no PDF. */
(function (w) {
  'use strict';
  const Q=w.DiarioJornalQualidade, cache=new Map(), privados=new Map();
  const privateKey=e=>String(e.prep_id||e.snapshot?.id||'');
  function withPrivate(e){const p=privados.get(privateKey(e));const owner=typeof SESS!=='undefined'?SESS?.uid:'';const {profit_local:ignored,...base}=e;return p&&p.owner===owner?{...base,profit_local:Q.clone(p)}:base;}
  function edition(value) {
    if(!value?.manchete) return value;
    const key=JSON.stringify(value);
    if(cache.has(key)) return withPrivate(Q.clone(cache.get(key)));
    const e=Q.prepare(value); cache.set(key,e);
    if(cache.size>8) cache.delete(cache.keys().next().value);
    return withPrivate(Q.clone(e));
  }
  function publicEdition(value){const e=edition(value);if(e)delete e.profit_local;return e;}
  w.DiarioJornalEditorial={edition};
  const journalView=vJornal;let legacyRefresh=false;
  vJornal=function(){if(!legacyRefresh && JRN.v?.manchete && !JRN.v.prep_id && !JRN.busy){legacyRefresh=true;JRN.v.antiga=true;setTimeout(()=>jrCarrega(false),0);}return journalView.apply(this,arguments);};
  const original=jrPinta;
  jrPinta=function(){
    if(JRN.v?.manchete) JRN.v=publicEdition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=publicEdition(JRN.arq);
    return original.apply(this,arguments);
  };
  // O painel da edição nunca é substituído por preços ao vivo de outro horário.
  jrIndsHtml=function(e){return {viv:false,h:(edition(e)?.cotacoes||[]).map(q=>`<span class="jrind"><small>${esc(q.n||q.k)}</small><b>${esc(Q.price(q))}</b><i>${esc(Q.change(q))}</i></span>`).join('')};};
  jrFechHtml=function(e){e=edition(e);return `<section class="jrsec jrfech"><h3>${esc(Q.phase(e).table)}</h3><p class="sm mut">Referências congeladas na edição. Coleta: ${esc(e.snapshot.coletado_em||'não registrada')}. Horário do negócio pode não estar disponível.</p><div class="jrvtab"><table><thead><tr><th>Ativo / referência</th><th>Último</th><th>Variação</th></tr></thead><tbody>${e.cotacoes.map(q=>`<tr><td>${esc(q.n||q.k)}<br><small>${esc(q.contrato||q.simbolo||q.fonte)} · ${esc(q.unidade)}</small></td><td>${esc(Q.price(q))}</td><td>${esc(Q.change(q))}</td></tr>`).join('')}</tbody></table></div></section>`;};
  jr5Html=function(e){const p=Q.phase(e);return `<section class="jrsec jr5"><h3>${esc(p.title)}</h3><p class="sm mut">${esc(p.next)}. Use os cenários como contexto; confirme preços e contrato no Profit.</p></section>`;};
  jeCot=function(q,dark){return `<div class="jecot${dark?' esc':''}"><small>${esc(q.n||q.k)}</small><b>${esc(Q.price(q))}</b><span>${esc(Q.change(q))}</span></div>`;};
  // Candles fornecidos atualmente por candles/WIN e candles/WDO são proxies à vista.
  // Não calcular pivôs do futuro nem descrever esse gráfico como o contrato negociável.
  jrTecDados=function(k){const e=edition(jrVer()),p=e?.snapshot?.niveis?.[k];return p?{...p,k,nome:p.tk,div:k==='wdo'?1000:1,tend:'Lateral',n:0}:null;};
  jrPlano=function(k){return jrTecDados(k);};
  jrPre=function(){return null;};
  jrGrafHtml=function(k){
    const e=edition(jrVer()),g=e?.snapshot?.graficos?.[k];
    return `<div class="jrgr" data-g="${esc(k)}"><p class="sm mut">${g?'Série do contrato disponível no PDF desta edição.':'Gráfico do contrato indisponível nesta edição. A série à vista não substitui WIN/WDO.'}</p></div>`;
  };
  jrGraf=async function(){ /* A leitura de uma edição não faz consulta de candles por polling. */ };
  jrGdHtml=function(){return '';};
  jrIndHtml=function(e){const m=edition(e)?.snapshot?.macro||{},L=m.ind||[];return L.length?`<section class="jrsec jrind2"><h3>Indicadores com referência</h3><div class="jrkp4">${L.map(x=>`<div><small>${esc(x.nome)}</small><b>${esc(Number(x.v).toLocaleString('pt-BR')+' '+x.un)}</b><span>${esc(x.periodo)}</span></div>`).join('')}</div></section>`:'';};
  jrRkHtml=function(){const e=edition(jrVer()),m=e?.snapshot?.movers;return m?.referencia_em?`<section class="jrsec"><h3>Destaques da sessão</h3><p>${[...(m.altas||[]),...(m.baixas||[])].map(x=>esc(x.tk)+' '+esc(Q.change({d1:x.var}))).join(' · ')}</p></section>`:'';};
  jrImpHtml=function(){return '';};
  jrResumoHtml=function(){return '';};
  document.addEventListener('click',async ev=>{
    const button=ev.target.closest?.('[data-jr-profit-capture]');if(!button||button.disabled)return;
    const e=edition(jrVer()),owner=typeof SESS!=='undefined'?SESS?.uid:'';if(!e?.snapshot||!owner){button.textContent='Entre na conta para consultar a ponte';return;}
    button.disabled=true;button.textContent='Consultando ponte…';
    try{
      let rows=null;const configured=w.DIARIO_PONTE_LOCAL?.cotacoesUrl;
      if(configured){const u=new URL(configured);if(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&!u.username&&!u.password){const r=await fetch(u.href,{signal:AbortSignal.timeout(4000),cache:'no-store',credentials:'omit'});if(r.ok){const data=await r.json();rows=Array.isArray(data)?data:data.cotacoes;}}}
      if(!Array.isArray(rows)){const r=await rq('/rest/v1/cotacoes?select=ticker,ult,var,abe,max,min,hor,dat,updated_at&user_id=eq.'+encodeURIComponent(owner)+'&or=(ticker.like.WIN*,ticker.like.WDO*)&limit=12',{signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('Ponte indisponível');rows=await r.json();}
      if(typeof SESS==='undefined'||SESS?.uid!==owner)return;
      privados.set(privateKey(e),{...Q.profit(rows,e),owner});jrPinta();
    }catch{button.disabled=false;button.textContent='Ponte indisponível · tentar novamente';}
  });
  function privateHtml(e){const p=e?.profit_local;return `<section class="jrsec"><h3>Referência privada do Profit</h3><p class="sm mut">Captura única. Não muda os números ou o texto da edição.</p><button class="btn s" data-jr-profit-capture>Capturar referência da ponte</button>${p?`<p class="sm">${esc(p.nota)}</p>${p.cotacoes.map(q=>`<p>${esc(q.contrato)} · ${esc(Q.price(q))} · ${esc(q.referencia_em)}${q.ohlc?' · OHLC informado':' · OHLC indisponível'}</p>`).join('')}${p.lacunas.map(x=>`<p class="sm mut">${esc(x)}</p>`).join('')}`:''}</section>`;}
  const renderBody=jrCorpo;
  jrCorpo=function(){
    if(JRN.v?.manchete) JRN.v=publicEdition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=publicEdition(JRN.arq);
    const html=renderBody.apply(this,arguments),e=edition(jrVer());
    if(!e?.qualidade) return html;
    const q=e.qualidade;
    const normalizedHtml=html.replace(/com pesquisa na internet e os números do app/g,e.pesquisa_web===true?'com pesquisa recuperada e dados desta edição':'com os dados recebidos; pesquisa web não confirmada em toda a edição');
    return privateHtml(e)+`<section class="jrsec jr-quality"><h3>${q.problemas.length?'Conteúdo da edição em revisão':'Referências e limites da edição'}</h3><p class="sm">${esc(Q.phase(e).title)} · ${esc(e.snapshot.id)}</p>${q.problemas.map(x=>`<p class="sm">${esc(x)}</p>`).join('')}<details><summary>Conferir fontes e limitações</summary>${q.lacunas.map(x=>`<p class="sm mut">${esc(x)}</p>`).join('')}</details></section>`+normalizedHtml;
  };
  const materia=jrMateria;
  jrMateria=function(m){
    let html=materia.apply(this,arguments);
    const link=Q.url(m?.fonte_url),parts=[['Fato recebido',m?.fato],['Interpretação',m?.interpretacao],['Cenário condicionado',m?.cenario]].filter(x=>x[1]);
    const evidence=`<div class="jr-evidence">${parts.map(([label,tx])=>`<p><b>${label}:</b> ${esc(tx)}</p>`).join('')}<p class="sm mut">${m?.conferencia_fonte?.estado?esc(m.conferencia_fonte.estado==='revisado_ia'?'Fonte recuperada e segunda leitura por IA; não é auditoria independente.':m.conferencia_fonte.motivo)+' ':''}${link?`Fonte vinculada: <a href="${esc(link)}" target="_blank" rel="noopener noreferrer">consultar documento</a>`:'Fonte específica pendente de conferência.'}</p></div>`;
    return html.replace('</article>',evidence+'</article>');
  };
  const style=document.createElement('style');style.id='jornal-editorial-v714';style.textContent=`.jr-quality{border-left:3px solid #D4A017;padding:12px;background:#11141B;color:#e9e9ea}[data-jr-profit-capture]{min-height:44px}.jr-quality summary{cursor:pointer;min-height:44px}.jrind b,.jrfech td,.jr-evidence{font-variant-numeric:tabular-nums}.jrfech td:nth-child(n+2){text-align:right;white-space:nowrap}.jrfech th{text-align:left}.jr-evidence{padding:10px 0;border-top:1px solid #1E232E}.jr-evidence p{line-height:1.5}.jrind small{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.jr-evidence a{overflow-wrap:anywhere}`;document.head.append(style);
})(window);
