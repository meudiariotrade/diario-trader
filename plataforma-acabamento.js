/* v308: navegação e leitura comuns às áreas internas, sem novos níveis de abas. */
(function(root){
 'use strict';
 const areas=[
  [['dia','regras','rev'],'Diário e processo'],
  [['ops','trades','swing','opc','stats','ativos','dash','opgrade','opfluxo','opcart','swbt','dtrpy'],'Operações e desempenho'],
  [['carteiras','analise','imposto'],'Patrimônio e pesquisa'],
  [['mercado','juros','live','graf'],'Mercado e contexto'],
  [['estudos','livro','ingles','cnpi'],'Estudos e formação'],
  [['mesa','painel','contratos','carreira'],'Gestão e risco'],
  [['mais','conta','import','status'],'Configurações e dados']
 ];
 function decorate(){
  const app=document.getElementById('app');if(!app)return;
  const area=areas.find(([keys])=>keys.includes(tab))?.[1];
  document.body.dataset.platformArea=area||'';
  if(area&&tab!=='home'&&tab!=='term'&&!app.querySelector('.platform-area')){
   const header=document.createElement('div');header.className='platform-area';
   const label=document.createElement('p');label.textContent='DIÁRIO DE TRADER / '+area;const search=document.createElement('button');search.type='button';search.dataset.wf='search';search.textContent='Buscar';search.setAttribute('aria-label','Buscar no aplicativo');header.append(label,search);app.prepend(header);
  }
  for(const row of app.querySelectorAll('.pftabs,.pro-tabs,.pro-subtabs,.cqtabs,.rs-tabs,.seg:not(.hub)')){
   row.classList.add('studio-tabs');if(!row.getAttribute('aria-label'))row.setAttribute('aria-label','Navegação - '+(area||'Aplicativo'));
  }
  document.getElementById('bnav')?.setAttribute('aria-label','Navegação principal');
 }
 root.TraderUI.onRender('plataforma-acabamento',decorate);decorate();
})(window);
