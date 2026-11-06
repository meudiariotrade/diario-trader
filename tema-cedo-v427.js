/* Diário de Trader v427 — aplica o tema claro antes da primeira pintura (evita piscar escuro). */
(function(){try{
  if(JSON.parse(localStorage.getItem('diario-theme'))!=='light')return;
  var d=document.documentElement;d.setAttribute('data-v427-tema','claro');
  var l=document.createElement('link');l.rel='stylesheet';l.id='v427-claro-css';l.href='tema-claro-v427.css?v=427';
  (document.head||d).appendChild(l);
}catch(e){}})();
