/* Economista existente em painel flutuante. Só envia perguntas por ação explícita. */
(() => {
  'use strict';
  const safe=value=>esc(String(value??''));let opened=false,root,button,panel,attachedContext='';
  function context(){
    const parts=[`Tela aberta: ${tab}.`];
    if(typeof T!=='undefined'&&T?.ativo)parts.push(`Ativo em edição: ${T.ativo}.`);
    if(window.PF?.sel)parts.push(`Ativo selecionado na carteira: ${window.PF.sel}.`);
    if(tab==='dia')parts.push(`Data do diário: ${D}.`);
    if(attachedContext)parts.push(attachedContext);
    return parts.join('\n')+'\nNão foram anexados saldos, posições, plano ou textos do diário.';
  }
  function list(title,items){return Array.isArray(items)&&items.length?`<details><summary>${safe(title)}</summary><ul>${items.map(item=>`<li>${safe(typeof item==='string'?item:JSON.stringify(item))}</li>`).join('')}</ul></details>`:''}
  function response(item){
    const r=item.r||{};
    return `<article class="wf-chat-message"><p class="wf-chat-question">${safe(item.q)}</p><h3>${safe(r.titulo||'Resposta da Economista IA')}</h3><p>${safe(r.resumo||'')}</p>${(r.explicacao||[]).map(p=>`<p>${safe(p)}</p>`).join('')}
      ${list('Fatos apresentados pelo modelo — confira as fontes',r.fatos)}
      ${list('Impactos descritos',r.impactos?.map(x=>`${x.mercado}: ${x.direcao}. ${x.porque||''}`))}
      ${list('Cenários condicionais',r.cenarios?.map(x=>`${x.nome}: ${x.descricao||''} Condições: ${x.gatilhos||'não informadas'}.${Number.isFinite(+x.probabilidade_pct)?' Estimativa do modelo: '+x.probabilidade_pct+'%, sem calibração estatística informada.':''}`))}
      ${list('O que observar',r.o_que_observar)}${r.contraponto?`<p><b>Contraponto:</b> ${safe(r.contraponto)}</p>`:''}
      ${list('Visões',r.visoes?.map(x=>`${x.escola}: ${x.argumento}`))}${list('Glossário',r.glossario?.map(x=>`${x.termo}: ${x.significado}`))}
      ${list('Fontes citadas na resposta',r.fontes)}<small>${safe(new Date(item.em).toLocaleString('pt-BR'))} · conteúdo gerado por IA</small></article>`;
  }
  function paint(){
    if(!panel)return;const history=panel.querySelector('.wf-chat-history'),input=panel.querySelector('textarea'),status=panel.querySelector('[role="status"]'),submit=panel.querySelector('[type="submit"]');
    history.innerHTML=ECO.l.length?ECO.l.map(response).join(''):'<p class="wf-chat-empty">Pergunte sobre juros, notícias, indicadores ou cenários. A conversa acompanha você entre as telas.</p>';
    status.textContent=ECO.busy?'Preparando a resposta…':ECO.err||'';submit.disabled=!!ECO.busy;input.disabled=!!ECO.busy;
    const preview=panel.querySelector('.wf-chat-context');preview.textContent=context();preview.hidden=!panel.querySelector('[name="context"]').checked;
  }
  function setOpen(value){
    opened=value;panel.hidden=!value;button.setAttribute('aria-expanded',String(value));
    if(value){paint();panel.querySelector('textarea').focus()}else button.focus();
  }
  function build(){
    if(root)return;
    root=document.createElement('div');root.id='economista-flutuante';
    root.innerHTML=`<button type="button" class="wf-chat-launcher" aria-label="Abrir Economista IA" aria-expanded="false" aria-controls="wf-chat-panel"><span aria-hidden="true">IA</span></button>
      <aside id="wf-chat-panel" class="wf-chat-panel" aria-label="Conversa com a Economista IA" hidden><header><div><b>Economista IA</b><small>Assistente virtual · mesma conversa entre telas</small></div><button type="button" data-chat-close aria-label="Minimizar conversa">−</button></header>
      <div class="wf-chat-history" aria-label="Histórico da conversa"></div><div class="wf-chat-status" role="status" aria-live="polite"></div>
      <form><label class="wf-chat-context-label"><input type="checkbox" name="context"> Anexar tela, ativo e indicadores públicos, sem saldos ou textos do diário</label><pre class="wf-chat-context" hidden></pre><label class="wf-chat-input-label">Sua pergunta<textarea rows="2" maxlength="6000" placeholder="O que você quer entender?"></textarea></label><div class="wf-chat-actions"><button type="button" data-chat-clear>Limpar conversa</button><button type="submit">Enviar</button></div><small>A consulta utiliza o provedor de IA configurado. Respostas e cenários podem conter erros; confirme fontes e datas.</small></form></aside>`;
    document.body.append(root);button=root.querySelector('.wf-chat-launcher');panel=root.querySelector('aside');
    button.addEventListener('click',()=>{if(!button._dragged)setOpen(!opened);button._dragged=false});
    panel.querySelector('[data-chat-close]').onclick=()=>setOpen(false);
    panel.querySelector('[name="context"]').onchange=paint;
    panel.querySelector('[data-chat-clear]').onclick=()=>{if(ECO.busy||!confirm('Limpar apenas o histórico da Economista IA neste aparelho?'))return;ECO.l=[];ECO.err='';ecoSalva();paint()};
    panel.querySelector('form').onsubmit=async event=>{
      event.preventDefault();const input=panel.querySelector('textarea'),question=input.value.trim();if(question.length<3||ECO.busy)return;
      if(window.DIARIO_DEMO){ECO.err='Demonstração: a consulta externa está desativada.';paint();return}
      const full=question+(panel.querySelector('[name="context"]').checked?'\n\nContexto autorizado:\n'+context():'');input.value='';
      await ecoPergunta(full);if(ECO.err)input.value=question;paint();panel.querySelector('.wf-chat-history').scrollTop=1e9;
    };
    panel.querySelector('textarea').addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();panel.querySelector('form').requestSubmit()}});
    let drag=null;
    button.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,left:button.getBoundingClientRect().left,top:button.getBoundingClientRect().top};button._dragged=false;button.setPointerCapture?.(event.pointerId)});
    button.addEventListener('pointermove',event=>{if(!drag||opened)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)<8)return;button._dragged=true;button.style.position='fixed';button.style.left=Math.max(8,Math.min(innerWidth-64,drag.left+dx))+'px';button.style.top=Math.max(8,Math.min(innerHeight-70,drag.top+dy))+'px';button.style.right='auto';button.style.bottom='auto'});
    button.addEventListener('pointerup',()=>{drag=null});button.addEventListener('pointercancel',()=>{drag=null});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&opened)setOpen(false)});
    window.addEventListener('resize',()=>{button.style.left='';button.style.top='';button.style.position='';button.style.right='';button.style.bottom=''});
  }
  build();
  const previousPaint=ecoPaint;ecoPaint=function(){previousPaint.apply(this,arguments);paint()};
  window.TraderUI.onRender('trader-chat',{
    before(){const legacy=tab==='mercado'&&MKT.tab==='eco';if(legacy)MKT.tab='mu';return legacy},
    after(legacy){paint();if(legacy)setOpen(true)}
  });
  try{for(const list of [HUB_M,...MGRP.map(g=>g[1])])for(let i=list.length-1;i>=0;i--)if((Array.isArray(list[i])?list[i][0]:list[i])==='mercado:eco')list.splice(i,1)}catch{}
  if(window.DIARIO_DEMO){for(const name of ['alEnable','alDisable','alTest'])try{window[name]=async()=>toast('Notificações reais desativadas na demonstração.')}catch{}const originalAccount=vConta;vConta=()=>'<h1>Demonstração</h1><p>Conta e sincronização real estão desativadas. Os exemplos usam um banco local separado.</p>'}
  window.TraderChat={open:(extra='')=>{attachedContext=typeof extra==='string'?extra:'';setOpen(true)},close:()=>setOpen(false),paint,context};
})();
