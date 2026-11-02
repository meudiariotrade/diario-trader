/* Acabamento compartilhado das telas e formulários. Sem substituir renderizadores. */
(function(root){
 'use strict';
 let fieldSerial=0;
 const names={home:'Início',dia:'Meu dia',ops:'Operações',trades:'Trades',stats:'Estatísticas',mercado:'Mercado',term:'Terminal',mais:'Configurações'};
 const icons={'×':'Fechar','✕':'Fechar','↻':'Atualizar','⟳':'Atualizar','🔄':'Atualizar','?':'Ajuda','…':'Mais opções','⋮':'Mais opções','☰':'Abrir menu','+':'Adicionar','＋':'Adicionar','−':'Diminuir'};
 function accessibleButtons(scope){
  for(const button of scope.querySelectorAll('button')){
   if(button.hasAttribute('aria-label')||button.hasAttribute('aria-labelledby'))continue;
   const text=button.textContent.trim();
   const name=button.title||names[button.dataset.tab]||icons[text];
   if(name)button.setAttribute('aria-label',name);
  }
 }
 function fields(scope){
  for(const field of scope.querySelectorAll('input:not([type=hidden]),select,textarea')){
   if(field.closest('label')||field.hasAttribute('aria-label')||field.hasAttribute('aria-labelledby')||field.id&&scope.querySelector(`label[for="${root.CSS?.escape?root.CSS.escape(field.id):field.id.replace(/[^\w-]/g,'')}"]`))continue;
   const label=field.previousElementSibling;
   if(label?.tagName==='LABEL'&&!label.querySelector('input,select,textarea')){
    if(!field.id)field.id='ui-field-'+(++fieldSerial);label.htmlFor=field.id;
   }else if(field.placeholder&&/[a-zÀ-ÿ]/i.test(field.placeholder))field.setAttribute('aria-label',field.placeholder);
  }
 }
 function tables(scope){
  for(const table of scope.querySelectorAll('table')){
   if(table.closest('.trm,.ui-table-scroll,.anxt,[data-ui-scroll]'))continue;
   const parent=table.parentElement;if(!parent)continue;
   // Mantém os contêineres de rolagem específicos dos módulos.
   if(/auto|scroll/.test(parent.style.overflowX)||parent.classList.contains('xt-w'))continue;
   const wrapper=root.document.createElement('div');wrapper.className='ui-table-scroll';
   wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',table.caption?.textContent?.trim()||'Tabela de dados · deslize para ver todas as colunas');wrapper.tabIndex=0;
   parent.insertBefore(wrapper,table);wrapper.appendChild(table);
   if(table.rows[0]?.cells.length>5)wrapper.classList.add('ui-table-wide');
   for(const cell of table.querySelectorAll('thead th'))if(!cell.hasAttribute('scope'))cell.scope='col';
  }
 }
 function enhance(scope){if(!scope)return;accessibleButtons(scope);fields(scope);tables(scope);for(const link of scope.querySelectorAll('a[target="_blank"]')){const rel=new Set((link.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');link.rel=[...rel].join(' ')}}
 function screen(){const app=root.document.getElementById('app');if(!app)return;app.dataset.screen=typeof tab==='string'?tab:'';app.classList.toggle('ui-standard-screen',tab!=='term');enhance(app);accessibleButtons(root.document.querySelector('nav')||root.document)}
 function sheet(){enhance(root.document.getElementById('sh'))}
 root.TraderUI.onRender('interface-acabamento',screen);
 root.TraderUI.onSheet('interface-acabamento',sheet);
 root.DiarioAcabamento=Object.freeze({enhance,screen,sheet});
 screen();sheet();
})(window);
