/* Edição guiada de registros existentes: nunca cria câmbio ou duplica uma movimentação. */
(function(root){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const fields=['tp','mk','tk','cl','d','q','p','cs','fx','ev','f','sub','nota'];
 function repair(rows,index,values,now=Date.now(),newId=''){
  if(!Number.isInteger(index)||!rows[index])throw Error('O lançamento não está mais disponível. Reabra a revisão.');
  const result=clone(rows),previous=result[index],next={...previous};
  for(const key of fields)if(Object.hasOwn(values,key))next[key]=String(values[key]).trim();
  if(next.tk)next.tk=next.tk.toUpperCase();
  if(['A','R'].includes(next.tp)){next.mk='BR';next.tk='';next.cl='';}
  if(previous.mk!==next.mk&&next.cl){const pairs={acao:'acao_ext',etf:'etf_ext',acao_ext:'acao',etf_ext:'etf'};if((next.mk==='US'&&['acao','etf'].includes(next.cl))||(next.mk==='BR'&&['acao_ext','etf_ext'].includes(next.cl)))next.cl=pairs[next.cl];}
  if(next.mk==='CR')next.cl='cripto';
  if(next.mk==='US'&&!['acao_ext','etf_ext'].includes(next.cl))next.cl=next.cl==='etf'?'etf_ext':'acao_ext';
  if(!['BR','US','CR'].includes(next.mk))throw Error('Escolha o mercado do lançamento.');
  if(!['A','R'].includes(next.tp)&&!next.tk)throw Error('Informe o ativo.');
  if(values.resolution==='distinct'){if(!newId||rows.some(r=>r.id===newId))throw Error('Identificação nova inválida.');next.id=newId;}
  if(!next.id){if(!newId)throw Error('Identificação de lançamento ausente.');next.id=newId;}
  const stamp=Math.max(now,(+previous.u||0)+1);next.u=stamp;
  result[index]=next;
  const C=root.CarteiraCalculo,before=C.audit(rows),after=C.audit(result),rowIssues=after.issues.filter(i=>i.index===index);
  if(rowIssues.length)throw Error(rowIssues.map(i=>i.message).join(' '));
  const prior=new Set(before.issues.map(i=>i.index+':'+i.code));
  const added=after.issues.find(i=>!prior.has(i.index+':'+i.code));
  if(added)throw Error('Esta alteração cria outra pendência em '+(added.ticker||'outro lançamento')+': '+added.message);
  if(root.TraderModel)root.TraderModel.archive(next,previous,'correcao-carteira',stamp,0);
  return {rows:result,remaining:after.issues};
 }
 root.CarteiraCorrectionModel={repair};
 if(!root.document)return;
 const safe=v=>esc(String(v??'')),labels={C:'Compra',V:'Venda',P:'Provento',E:'Evento corporativo',A:'Aporte',R:'Retirada'};
 const fieldByCode={fx:'fx',oversell:'q',quantity:'q',price:'p',fee:'cs',date:'d',event:'f',type:'tp',duplicate:'resolution'};
 let dialog=null,index=null,original='',owner=null,draft=null;
 const ledger=()=>S.cart?.lanc||[],account=()=>SESS?.uid||S.uid||null;
 function issues(){return root.CarteiraCalculo.audit(ledger()).issues}
 function input(key,label,type='text',invalid=false){return `<label class="${invalid?'cc-field-error':''}">${safe(label)}${invalid?'<small>Campo a corrigir</small>':''}${invalid&&key==='fx'?'<small>Use o câmbio da nota ou do extrato desta operação.</small>':''}<input name="${key}" type="${type}" value="${safe(draft[key]??'')}"${type==='text'&&['q','p','cs','fx','f'].includes(key)?' inputmode="decimal"':''}${invalid?' aria-invalid="true"':''}></label>`}
 function choose(key,label,options,invalid=false){return `<label class="${invalid?'cc-field-error':''}">${label}<select name="${key}"${invalid?' aria-invalid="true"':''}>${Object.entries(options).map(([v,t])=>`<option value="${v}"${draft[key]===v?' selected':''}>${t}</option>`).join('')}</select></label>`}
 function selectRow(i){index=i;draft=clone(ledger()[i]);original=JSON.stringify(ledger()[i]);paint();const code=issues().find(v=>v.index===index)?.code,key=fieldByCode[code];const target=dialog.querySelector(`[name="${key||'d'}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:'center'})}
 function paint(message=''){
  const pending=issues(),selected=pending.filter(i=>i.index===index),bad=new Set(selected.map(i=>fieldByCode[i.code])),row=ledger()[index];
  if(!row){index=null;draft=null}
  const queue=[...new Set(pending.map(i=>i.index))];
  dialog.innerHTML=`<header><div><small>CARTEIRA · MOVIMENTAÇÕES</small><h2>${draft?'Corrigir '+safe(row.tk||labels[row.tp]):'Revisão concluída'}</h2></div><button class="btn s" type="button" data-cc="close">Fechar</button></header><div class="wf-content">${message?`<p role="status" class="cc-status">${safe(message)}</p>`:''}${queue.length?`<label>Lançamento para revisar<select data-cc="choose">${queue.map(i=>`<option value="${i}"${i===index?' selected':''}>${safe(ledger()[i].d)} · ${safe(ledger()[i].tk||labels[ledger()[i].tp])} · ${safe(pending.filter(p=>p.index===i).map(p=>p.message).join(' '))}</option>`).join('')}</select></label>`:'<p>Não há pendências detectadas pelas regras da conferência. Os indicadores da carteira serão recalculados.</p>'}${draft?`<section class="cc-reasons"><h3>O que precisa mudar</h3>${selected.length?selected.map(i=>`<p>${safe(i.message)}</p>`).join(''):'<p>Edite os dados deste lançamento conforme sua nota ou extrato.</p>'}${bad.has('fx')?'<p>Informe o câmbio usado neste lançamento, em reais por US$ 1. Use a nota ou o extrato da data da operação; o dólar atual não serve para corrigir o custo histórico.</p>':''}${selected.some(i=>i.code==='oversell')?'<p>Confira se falta uma compra anterior ou um evento corporativo. Se o registro estiver correto, feche esta janela e cadastre a movimentação que falta.</p>':''}</section><form id="cc-form"><div class="cc-grid">${choose('tp','Tipo',labels,bad.has('tp'))}${choose('mk','Mercado / moeda',{BR:'Brasil · BRL',US:'Estados Unidos · USD',CR:'Cripto · BRL'})}${input('tk','Ativo')}${input('d','Data','date',bad.has('d'))}${['C','V','P'].includes(draft.tp)?input('q',draft.tp==='P'?'Quantidade do provento (vazio = valor total)':'Quantidade','text',bad.has('q')):''}${input('p',draft.tp==='E'?'Custo atribuído na bonificação':draft.tp==='P'?'Valor por unidade ou total (conforme quantidade)':'Preço unitário / valor','text',bad.has('p'))}${input('cs','Taxas e custos','text',bad.has('cs'))}${draft.mk==='US'?input('fx','Câmbio histórico · R$ por US$ 1','text',bad.has('fx')):''}${draft.tp==='E'?choose('ev','Evento',{desd:'Desdobramento',grup:'Grupamento',bonif:'Bonificação'})+input('f','Fator / percentual','text',bad.has('f')):''}${bad.has('resolution')?choose('resolution','Mesmo identificador de negócio',{'':'Escolha como tratar',distinct:'São movimentações diferentes · separar identificação'},true):''}${input('nota','Anotação')}</div><p class="cc-error" role="alert"></p><div class="cc-actions"><button type="submit" class="btn">Salvar correção</button><button type="button" class="btn s" data-cc="close">Cancelar</button></div><p class="rs-note">Você está editando um registro existente. O aplicativo mantém uma cópia anterior no histórico local e recalcula a carteira. Não altera ordens na corretora.</p></form>`:''}</div>`;
 }
 function open(i){
  root.TerminalResearch?.state&&document.getElementById('research-workbench')?.close();root.TraderChat?.close();
  if(tab!=='carteiras')root.DIARIO_NAV.navigate('carteiras');root.PF.aba='ativos';root.PF.amb='mov';root.PF.sel=null;root.PF.form=null;render();
  owner=account();const target=Number.isInteger(i)?i:issues()[0]?.index;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='cc-editor';dialog.className='wf-dialog cc-editor';dialog.setAttribute('aria-label','Corrigir movimentações da carteira');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-cc="close"]'))dialog.close()});dialog.addEventListener('change',e=>{if(e.target.matches('[data-cc="choose"]'))return selectRow(Number(e.target.value));if(e.target.name&&draft){Object.assign(draft,Object.fromEntries(new FormData(dialog.querySelector('form'))));if(['tp','mk','ev'].includes(e.target.name))paint()}});dialog.addEventListener('submit',submit);dialog.addEventListener('close',()=>{index=null;draft=null;original='';root.TraderUI.refreshScroll()})}
  if(!dialog.open)dialog.showModal();if(target!==undefined&&ledger()[target])selectRow(target);else{index=null;draft=null;paint()}root.TraderUI.refreshScroll();
 }
 function submit(event){
  event.preventDefault();const error=dialog.querySelector('.cc-error');
  try{
   if(account()!==owner)throw Error('A conta mudou. Feche e reabra a revisão.');
   if(S.del?.[ledger()[index]?.id]&&S.del[ledger()[index].id]>=(+ledger()[index].u||0))throw Error('Este lançamento foi excluído. Feche e reabra a carteira.');
   if(JSON.stringify(ledger()[index])!==original)throw Error('Este lançamento mudou durante a edição. Feche e reabra para evitar sobrescrever a alteração.');
   const values=Object.fromEntries(new FormData(event.target)),result=repair(ledger(),index,values,Date.now(),uid());
   S.cart.lanc=result.rows;root.PF.perfCache=null;root.PF.qts=0;save();render();
   const next=result.remaining[0]?.index;
   if(next!==undefined){selectRow(next);dialog.querySelector('.wf-content').insertAdjacentHTML('afterbegin','<p class="cc-status" role="status">Correção aplicada. Revise a próxima pendência. O estado do salvamento aparece na barra do aplicativo.</p>')}
   else{index=null;draft=null;paint('Correção aplicada. Nenhuma pendência restante. O estado do salvamento aparece na barra do aplicativo.')}
  }catch(e){error.textContent=e.message||String(e)}
 }
 function decorate(){
  if(owner!==null&&account()!==owner)dialog?.close();if(tab!=='carteiras')return;
  document.querySelectorAll('[data-pf^="del|"]').forEach(b=>{const id=b.dataset.pf.slice(4),matches=ledger().map((r,i)=>({r,i})).filter(v=>v.r.id===id);if(matches.length!==1||b.parentElement.querySelector('[data-cc-index]'))return;const edit=document.createElement('button');edit.type='button';edit.className='pfbt pfmini';edit.dataset.ccIndex=matches[0].i;edit.textContent='Editar';b.before(edit)});
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-cc-index]');if(b){e.preventDefault();e.stopImmediatePropagation();open(Number(b.dataset.ccIndex))}},true);
 root.TraderUI.onRender('carteira-correcao',decorate);
 root.CarteiraCorrection={open,decorate};
})(typeof window==='undefined'?globalThis:window);
