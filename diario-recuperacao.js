/* Recuperação explícita de edições concorrentes e modo de foco. */
(() => {
  'use strict';
  const labels={plano:'Plano',resumo:'Resumo',aprend:'Aprendizado',pre:'Ensaio mental',bem:'O que fiz bem',chk:'Checklist',us:'EUA'};
  const focused=()=>{try{return localStorage.getItem('diario-foco')==='1'}catch{return false}};
  function decorate() {
    const root=document.getElementById('app');if(!root)return;
    root.classList.toggle('diary-focus',tab==='dia'&&focused());
    if(tab==='dia'&&DV!=='hist') {
      const actions=document.createElement('div');actions.className='diary-toolbar';
      const focus=document.createElement('button');focus.type='button';focus.className='btn s';focus.dataset.diaryFocus='1';
      focus.textContent=root.classList.contains('diary-focus')?'Mostrar todos os painéis':'Modo foco';actions.append(focus);
      const h=root.querySelector('h1');if(h)h.after(actions);
    }
    const entries=Object.entries(diarioDaysCanonical()).flatMap(([date,day])=>(day._conflicts||[]).map(conflict=>({date,conflict})));
    if(!entries.length||root.querySelector('.diary-conflicts'))return;
    const panel=document.createElement('details');panel.className='card diary-conflicts';panel.open=tab==='dia';
    const summary=document.createElement('summary');summary.textContent=`${entries.length} edição(ões) do diário para conferir`;panel.append(summary);
    const intro=document.createElement('p');intro.textContent='Duas versões foram preservadas durante a sincronização. Confira o conteúdo e escolha qual manter. Nada foi descartado deste registro de conflito.';panel.append(intro);
    entries.forEach(({date,conflict})=>{
      const row=document.createElement('div');row.className='diary-conflict';
      const title=document.createElement('b');title.textContent=date+' · '+conflict.path.map(k=>labels[k]||k).join(' / ');row.append(title);
      conflict.versions.forEach((version,index)=>{
        const text=document.createElement('pre');text.textContent=!version.present?'Campo removido':typeof version.value==='string'?version.value||'(vazio)':JSON.stringify(version.value,null,2);row.append(text);
        const choose=document.createElement('button');choose.type='button';choose.className='btn s';choose.textContent='Manter esta versão';
        choose.addEventListener('click',()=>{if(window.DiarioDados.resolve(diarioDaysCanonical()[date],conflict.id,index)){save();render()}});row.append(choose);
      });panel.append(row);
    });root.prepend(panel);
  }
  const before=render0;render0=function(){const result=before.apply(this,arguments);decorate();return result};
  document.addEventListener('click',event=>{if(!event.target.closest('[data-diary-focus]'))return;const active=focused();try{localStorage.setItem('diario-foco',active?'0':'1')}catch{toast('Não foi possível guardar a preferência neste aparelho.')}render()});
})();
