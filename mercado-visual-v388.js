/* Diário de Trader v388 — melhoria progressiva da aba Mercado.
 * Respeita o renderizador existente; não chama APIs nem altera cotações. */
(function(root){
  'use strict';
  const doc=root.document;
  if(!doc||root.__diarioMercado388)return;
  root.__diarioMercado388=true;
  let query='',scheduled=false,observer=null;
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  function currentRows(box){return Array.from(box.querySelectorAll('.cql > .cqr'));}
  function update(box){
    if(!box)return;
    const rows=currentRows(box),terms=normalize(query),keywords=terms.split(/\s+/).filter(Boolean);
    let visible=0;
    rows.forEach(row=>{
      const title=row.querySelector('.cqn');
      const text=normalize((title?.querySelector('b')?.textContent||'')+' '+(title?.querySelector('small')?.textContent||''));
      const match=keywords.every(word=>text.includes(word));
      row.hidden=!match;if(match)visible++;
    });
    const count=box.querySelector('[data-cq388-count]');
    if(count){const label=rows.length?`${visible} de ${rows.length} ativos`:'Aguardando dados';if(count.textContent!==label)count.textContent=label;}
    const empty=box.querySelector('[data-cq388-empty]');
    if(empty)empty.hidden=!rows.length||!!visible;
    const clear=box.querySelector('[data-cq388-clear]');
    if(clear)clear.hidden=!query;
  }
  function enhance(box){
    if(!box)return;
    const tabs=box.querySelector(':scope > .cqtabs');
    if(!tabs)return;
    const selected=tabs.querySelector('button.on');
    if(selected){selected.setAttribute('aria-current','page');}
    if(box.id!=='cotbox')return; // As ADRs mantêm suas opções específicas.
    let tool=box.querySelector(':scope > .cq388-searchbar');
    if(!tool){
      tool=doc.createElement('div');tool.className='cq388-searchbar';
      const label=doc.createElement('label');label.className='cq388-searchbox';
      const icon=doc.createElement('span');icon.textContent='⌕';icon.setAttribute('aria-hidden','true');
      const input=doc.createElement('input');input.type='search';input.autocomplete='off';input.spellcheck=false;
      input.placeholder='Buscar ticker ou empresa';input.setAttribute('aria-label','Buscar ativo nesta lista');
      input.setAttribute('data-cq388-search','');input.value=query;
      const clear=doc.createElement('button');clear.type='button';clear.className='cq388-clear';clear.setAttribute('data-cq388-clear','');clear.setAttribute('aria-label','Limpar busca');clear.textContent='×';clear.hidden=!query;
      label.append(icon,input,clear);
      const count=doc.createElement('span');count.className='cq388-count';count.setAttribute('data-cq388-count','');count.setAttribute('aria-live','polite');
      tool.append(label,count);
      const bar=box.querySelector(':scope > .cqbar');
      if(bar)bar.before(tool);else tabs.after(tool);
    }
    const input=tool.querySelector('[data-cq388-search]');
    if(input&&input!==doc.activeElement&&input.value!==query)input.value=query;
    if(!box.querySelector('[data-cq388-empty]')){
      const empty=doc.createElement('p');empty.className='cq388-empty';empty.setAttribute('data-cq388-empty','');
      empty.textContent='Nenhum ativo encontrado nesta lista.';empty.hidden=true;
      const list=box.querySelector('.cql');if(list)list.after(empty);else tool.after(empty);
    }
    update(box);
  }
  function reconcile(){
    scheduled=false;
    const app=doc.getElementById('app');if(!app)return;
    const box=app.querySelector('#cotbox, #cqbox');
    if(box)enhance(box);
  }
  function schedule(){if(scheduled)return;scheduled=true;(root.requestAnimationFrame||root.setTimeout).call(root,reconcile,0);}
  doc.addEventListener('input',event=>{
    const target=event.target;
    if(!target||!target.matches?.('[data-cq388-search]'))return;
    query=target.value||'';
    update(target.closest('#cotbox'));
  });
  doc.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-cq388-clear]')){
      event.preventDefault();query='';const box=doc.getElementById('cotbox');
      const input=box?.querySelector('[data-cq388-search]');if(input){input.value='';input.focus();}update(box);return;
    }
    if(event.target?.closest?.('[data-cqa]')){query='';schedule();}
  });
  function init(){
    const app=doc.getElementById('app');if(!app)return;
    if(!observer&&typeof root.MutationObserver==='function'){
      observer=new root.MutationObserver(schedule);
      observer.observe(app,{childList:true,subtree:true});
    }
    schedule();
  }
  try{root.TraderUI?.onRender?.('mercado-visual-v388',schedule);}catch(_){}
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
