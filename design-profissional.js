/* v307 — apresentação, sem alterar registros, regras ou integrações. */
(function(root){
 'use strict';
 const doc=root.document;
 const make=(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 function greeting(hour){return hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite'}
 function intro(){
  const header=make('header','studio-intro');header.id='studio-intro';
  const top=make('div','studio-intro-top');
  const date=make('span','studio-eyebrow',new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'2-digit',month:'long'}));
  const tools=make('div','studio-intro-tools');
  const search=make('button','studio-tool','Buscar');search.type='button';search.dataset.wf='search';search.setAttribute('aria-label','Buscar no aplicativo');
  const preferences=make('button','studio-tool','Personalizar');preferences.type='button';preferences.dataset.wf='organize-home';
  tools.append(search,preferences);top.append(date,tools);
  const hour=Number(new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  header.append(top,make('p','studio-greeting',greeting(hour)),make('h1','','Seu processo, em foco.'),make('p','studio-intro-copy','Prepare o dia, acompanhe o mercado e registre suas decisões.'));
  return header;
 }
 function shortcuts(){
  const section=make('section','studio-shortcuts');section.id='studio-shortcuts';section.setAttribute('aria-label','Acessos rápidos');
  // Ícones mantêm o sistema vetorial existente; os nomes permanecem visíveis.
  for(const [route,title,subtitle,icon] of [['term','Terminal','Seu radar de mercado','chart'],['carteiras','Carteiras','Posições e patrimônio','wallet'],['estudos','Estudos','Seu espaço de evolução','book']]){
   const button=make('button','studio-shortcut');button.type='button';button.dataset.navroute=route;
   const symbol=make('span','studio-shortcut-icon');symbol.setAttribute('aria-hidden','true');
   if(typeof root.icoSvg==='function')symbol.innerHTML=root.icoSvg(icon);
   button.append(symbol,make('b','',title),make('small','',subtitle));section.append(button);
  }
  return section;
 }
 function tabs(scope){
  scope.querySelectorAll('.pro-tabs,.pro-subtabs,.pftabs,.cqtabs,.seg:not(.hub),.rs-tabs').forEach(row=>{
   row.classList.add('studio-tabs');
   for(const button of row.querySelectorAll('button')){
    const selected=button.classList.contains('on')||button.getAttribute('aria-current')==='page';
    if(selected)button.setAttribute('aria-current','page');
    else if(button.getAttribute('aria-current')==='page')button.removeAttribute('aria-current');
   }
  });
 }
 function decorate(){
  const app=doc.getElementById('app');if(!app)return;
  doc.body.classList.add('studio-design');doc.body.classList.toggle('studio-home',tab==='home');
  if(tab==='home'){
   let header=app.querySelector('#studio-intro');if(!header){header=intro();app.prepend(header)}
   let links=app.querySelector('#studio-shortcuts');if(!links){links=shortcuts();header.after(links)}
   const routine=app.querySelector('.routine-card');if(routine){
    links.after(routine);routine.classList.add('studio-routine');
    const eyebrow=routine.querySelector('.routine-eyebrow');if(eyebrow)eyebrow.textContent='SEU PROCESSO';
    const title=routine.querySelector('#routine-title');if(title)title.textContent='Preparação e revisão';
    if(!routine.querySelector('.studio-routine-action')){const action=make('button','btn studio-routine-action','Abrir meu dia →');action.type='button';action.dataset.routine='pre';routine.append(action)}
   }
  }
  tabs(app);
  const nav=doc.querySelector('body > nav');if(nav)nav.setAttribute('aria-label','Navegação principal');
 }
 function sheet(){const box=doc.getElementById('sh');if(box)tabs(box)}
 root.TraderUI.onRender('design-profissional',decorate);root.TraderUI.onSheet('design-profissional',sheet);
 root.TraderDesign=Object.freeze({decorate,greeting});decorate();
})(window);
