/* v714: mesma edição e mesmas referências na tela e no PDF. */
(function (w) {
  'use strict';
  const Q=w.DiarioJornalQualidade, cache=new Map();
  function edition(value) {
    if(!value?.manchete) return value;
    const key=JSON.stringify(value);
    if(cache.has(key)) return Q.clone(cache.get(key));
    const e=Q.prepare(value); cache.set(key,e);
    if(cache.size>8) cache.delete(cache.keys().next().value);
    return Q.clone(e);
  }
  w.DiarioJornalEditorial={edition};
  const original=jrPinta;
  jrPinta=function(){
    if(JRN.v?.manchete) JRN.v=edition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=edition(JRN.arq);
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
  const renderBody=jrCorpo;
  jrCorpo=function(){
    if(JRN.v?.manchete) JRN.v=edition(JRN.v);
    if(JRN.arq?.manchete) JRN.arq=edition(JRN.arq);
    const html=renderBody.apply(this,arguments),e=edition(jrVer());
    if(!e?.qualidade) return html;
    const q=e.qualidade;
    return `<section class="jrsec jr-quality"><h3>${q.problemas.length?'Edição com divergências em revisão':'Referências e limites da edição'}</h3><p class="sm">${esc(Q.phase(e).title)} · ${esc(e.snapshot.id)}</p>${q.problemas.map(x=>`<p class="sm">${esc(x)}</p>`).join('')}<details><summary>Conferir fontes e limitações</summary>${q.lacunas.map(x=>`<p class="sm mut">${esc(x)}</p>`).join('')}</details></section>`+html;
  };
  const materia=jrMateria;
  jrMateria=function(m){
    let html=materia.apply(this,arguments);
    const link=Q.url(m?.fonte_url),parts=[['Fato recebido',m?.fato],['Interpretação',m?.interpretacao],['Cenário condicionado',m?.cenario]].filter(x=>x[1]);
    const evidence=`<div class="jr-evidence">${parts.map(([label,tx])=>`<p><b>${label}:</b> ${esc(tx)}</p>`).join('')}<p class="sm mut">${link?`Fonte vinculada: <a href="${esc(link)}" target="_blank" rel="noopener noreferrer">consultar documento</a>`:'Fonte específica pendente de conferência.'}</p></div>`;
    return html.replace('</article>',evidence+'</article>');
  };
  const style=document.createElement('style');style.id='jornal-editorial-v714';style.textContent=`.jr-quality{border-left:3px solid #D4A017;padding:12px;background:#11141B;color:#e9e9ea}.jr-quality summary{cursor:pointer;min-height:44px}.jrind b,.jrfech td,.jr-evidence{font-variant-numeric:tabular-nums}.jrfech td:nth-child(n+2){text-align:right;white-space:nowrap}.jrfech th{text-align:left}.jr-evidence{padding:10px 0;border-top:1px solid #1E232E}.jr-evidence p{line-height:1.5}.jrind small{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.jr-evidence a{overflow-wrap:anywhere}`;document.head.append(style);
})(window);
