/* Radar integrado: reutiliza o cache e o ciclo de atualização do Terminal. */
(function(){
 'use strict';
 const a=window.TRM;if(!a)return;
 const safe=x=>a.esc2(String(x??'')),finite=x=>typeof x==='number'&&Number.isFinite(x);
 const number=(v,d=2)=>finite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const percent=v=>finite(v)?(v>0?'+':'')+number(v)+'%':'—';
 const time=v=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'não informado';
 const normalized=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const quotes=[['CME_MINI:NQ1!','Nasdaq futuro',2],['CME_MINI:ES1!','S&P 500 futuro',2],['BMFBOVESPA:WIN1!','Mini índice · WIN',0],['BMFBOVESPA:WDO1!','Mini dólar · WDO',1],['FX_IDC:USDBRL','Dólar / real',4],['TVC:DXY','DXY',2],['TVC:VIX','VIX',2],['TVC:US10Y','Treasury 10 anos',3]];
 const params={s:quotes.map(x=>x[0])};
 let dialog=null,trigger=null,loadedUser=null,scheduled=false;
 function label(id,w){return ({global:'Radar Global',dt:'Fluxo e Day Trade',macro:'Juros e Macroeconomia',ia:'Central de Inteligência'})[id]||w.n||id}
 function sorted(){const priority=['global','dt','macro','ia'];return Object.entries(a.TS().wss).sort((x,y)=>{const rank=k=>priority.includes(k)?priority.indexOf(k):99;return rank(x[0])-rank(y[0])})}
 function key(){return 'diario-terminal-resume-v306-'+(typeof SESS!=='undefined'&&SESS?.uid||'local')}
 function remember(){
  if(typeof tab!=='undefined'&&tab!=='term')return;
  const s=a.TS();s.resume={ws:s.ws,mob:a.TR.mob,foco:a.TR.foco};
  try{localStorage.setItem(key(),JSON.stringify(s.resume))}catch{}
 }
 function prepare(){
  const s=a.TS();
  if(!s.wss.global)s.wss.global={n:'Radar Global',p:['GLOBAL','DIFUT','ECO','NEWSBR'],t:[['GLOBAL','WEI','FX','CMDTY','ADR'],['DIFUT','WIRP','GC'],['ECO','EVT'],['NEWSBR','NEWSUS','TOP']],g:[{x:0,y:0,w:7,h:15},{x:7,y:0,w:5,h:15},{x:0,y:15,w:5,h:13},{x:5,y:15,w:7,h:13}]};
  if(loadedUser===key())return;loadedUser=key();
  let last=s.resume;try{last=JSON.parse(localStorage.getItem(key())||'null')||last}catch{}
  if(last&&s.wss[last.ws]){s.ws=last.ws;const max=s.wss[last.ws].p.length-1;const clamp=v=>Number.isInteger(v)?Math.max(0,Math.min(max,v)):0;a.TR.mob=clamp(last.mob);a.TR.foco=clamp(last.foco)}
 }
 function note(state,ttl){return `<div class="trfont">Consulta: ${safe(time(state.v?.em))} · ${state.err?'Falha na atualização · cópia anterior':!state.v?'Aguardando fonte':Date.now()-state.ts>ttl*2?'Consulta antiga':'Atualização automática'}${state.err?' · '+safe(state.err):''}. Horários em Brasília.</div>`}
 a.FN.GLOBAL='Radar Global · futuros, dólar e contexto do pregão';
 a.EXT.GLOBAL={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('cot',params,30000)},body:()=>{
  const state=a.trGet('cot',params),rows=state.v?.itens||[];
  const cards=quotes.map(([symbol,name,dp])=>{
   const q=rows.find(x=>x.pedido===symbol||x.s===symbol)||{};
   const local=/WIN1!/.test(symbol)?'WINFUT':/WDO1!/.test(symbol)?'WDOFUT':null;
   const current=a.melhorPx(local||symbol,q,q.r)||{};
   const bridge=local?a.profitDe?.(local):null;
   const px=finite(current.px)?current.px:q.px,d1=finite(current.px)?current.d1:q.d1;
   return `<article class="radar-quote"><span>${safe(name)}</span><strong>${number(px,dp)}</strong><b class="${finite(d1)?d1>0?'tg':d1<0?'tr':'':''}">${percent(d1)}</b><small>${safe(current.fonte||q.fonte||'TradingView')} · ${safe(current.fonte==='Profit'?(current.rt?'recebimento recente':'sem recebimento recente'):q.atraso===false?'tempo real na fonte':q.atraso?'com atraso':'atraso não confirmado')}<br>Preço: ${safe(current.fonte==='Profit'?bridge?.dat?bridge.dat+' '+(bridge.hor||''):'horário do negócio não informado':time(q.horarioPreco||q.dado_em))}${current.fonte==='Profit'?'<br>Recebido: '+safe(time(current.ts)):q.snapshot?'<br>Cópia do servidor':''}</small></article>`;
  }).join('');
  return `<div class="trsec">Brasil e EUA · radar de acompanhamento</div><div class="radar-quotes">${cards}</div><p class="trnote">Nasdaq futuro é a referência do mercado futuro; USTEC/NAS100 da sua corretora pode ter preço diferente. WIN/WDO usam a ponte quando há dado válido.</p>${note(state,30000)}`;
 }};
 a.FN.DIFUT='DI Futuros · curva, variação em pontos-base e referência oficial';
 a.EXT.DIFUT={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('copom',{},60000)},body:()=>{
  const state=a.trGet('copom',{}),d=state.v;
  if(!d)return a.carregando(state.err||'Consultando curva DI…');
  const curve=d.curva||[];
  return `<div class="trsec">DI Futuros · curva de juros</div><p class="trnote">Selic ${number(d.selic)}% · CDI ${number(d.cdi)}% · ref. ${safe(d.cdi_ref||'não informada')}</p>`+a.tabela(['Contrato','Taxa a.a.','Δ pb','Preço em'],curve.map(q=>`<tr><td>${safe(q.cod)}</td><td class="num">${number(q.taxa)}%</td><td class="num ${q.var_pb>0?'tr':q.var_pb<0?'tg':''}">${finite(q.var_pb)?(q.var_pb>0?'+':'')+number(q.var_pb,0):'—'}</td><td>${safe(time(q.horarioPreco))}</td></tr>`),'di-radar')+(!curve.length?'<p class="trnote">Curva indisponível. Nenhuma taxa foi estimada.</p>':'')+`<p class="trnote">${safe(d.fonte||'')}${(d.avisos||[]).map(x=>'<br>'+safe(x)).join('')}</p>`+note(state,60000);
 }};
 for(const [cmd,query,title]of [['NEWSBR','Brasil Ibovespa dólar economia','Notícias · Brasil'],['NEWSUS','United States Nasdaq Federal Reserve markets','Notícias · EUA e mundo']]){
  const args={q:query};a.FN[cmd]=title;
  a.EXT[cmd]={livre:true,vivo:true,load:async()=>{if(!document.hidden)await a.trFn('noticias',args,180000)},body:()=>{
   const state=a.trGet('noticias',args),items=state.v?.itens||[],seen=new Set();
   const news=items.filter(n=>{const k=normalized(n.t).replace(/[^a-z0-9]/g,'');if(seen.has(k))return false;seen.add(k);return true}).slice(0,30);
   return `<div class="trsec">${title}</div>`+news.map(n=>{let url='#';try{const u=new URL(n.l||n.u||n.url||n.link);if(/^https?:$/.test(u.protocol))url=u.href}catch{}return `<article class="radar-news"><a href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(n.t)}</a><small>${safe(n.f)} · ${safe(time(n.d))}</small></article>`}).join('')+(!news.length?a.carregando(state.err||'Consultando notícias…'):'')+note(state,180000);
  }};
 }
 function close(){if(dialog?.open)dialog.close()}
 function choose(id){const select=document.querySelector('[data-trlay]');close();if(!select)return;select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));remember()}
 function openPicker(){
  trigger=document.querySelector('[data-radar-picker]');dialog?.remove();dialog=document.createElement('dialog');dialog.className='radar-picker';dialog.setAttribute('aria-label','Selecionar painel do Terminal');
  const head=document.createElement('header'),title=document.createElement('strong'),exit=document.createElement('button');title.textContent='Selecionar painel';exit.type='button';exit.textContent='Fechar';exit.addEventListener('click',close);head.append(title,exit);
  const search=document.createElement('input');search.type='search';search.placeholder='Pesquisar painéis…';search.setAttribute('aria-label','Pesquisar painéis');
  const list=document.createElement('div');list.className='radar-picker-list';
  function draw(){list.replaceChildren();const q=normalized(search.value);for(const [id,w]of sorted()){if(!normalized(label(id,w)+' '+w.p.join(' ')).includes(q))continue;const b=document.createElement('button');b.type='button';b.textContent=label(id,w);b.setAttribute('aria-current',String(id===a.TS().ws));b.addEventListener('click',()=>choose(id));list.append(b)}if(!list.children.length){const p=document.createElement('p');p.textContent='Nenhum painel encontrado.';list.append(p)}const add=document.createElement('button');add.type='button';add.textContent='+ Novo espaço';add.addEventListener('click',()=>choose('__novo'));list.append(add)}
  search.addEventListener('input',draw);dialog.addEventListener('click',e=>{if(e.target===dialog)close()});dialog.addEventListener('close',()=>trigger?.isConnected&&trigger.focus());dialog.append(head,search,list);document.body.append(dialog);draw();dialog.showModal();search.focus();
 }
 function mount(){
  if(!document.body.classList.contains('trmon')){close();return}
  const select=document.querySelector('[data-trlay]');if(!select)return;
  // O select fica como adaptador dos eventos existentes; o menu visível é sólido e pesquisável.
  select.hidden=true;select.style.display='none';let b=select.parentNode.querySelector('[data-radar-picker]');
  if(!b){b=document.createElement('button');b.type='button';b.className='trbtn radar-picker-trigger';b.dataset.radarPicker='';b.setAttribute('aria-haspopup','dialog');b.addEventListener('click',openPicker);select.after(b)}
  b.textContent=label(a.TS().ws,a.TS().wss[a.TS().ws])+' ▾';remember();
 }
 if(typeof render0==='function'){const original=render0;render0=function(){if(tab==='term')prepare();return original.apply(this,arguments)}}
 if(window.TraderUI?.onRender)window.TraderUI.onRender('terminal-radar',mount);
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-trmob],[data-trp]'))requestAnimationFrame(remember)});
 addEventListener('pagehide',remember);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){remember();return}if(typeof tab!=='undefined'&&tab==='term')a.layAtual().p.forEach((_,i)=>a.carrega(i))});
 const style=document.createElement('style');style.textContent=`.radar-picker{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:80dvh;margin:auto;padding:16px;border:1px solid #344256;border-radius:16px;background:#101820!important;color:#e5edf5!important;box-shadow:0 20px 80px #0009;backdrop-filter:none!important;font:14px system-ui}.radar-picker::backdrop{background:#0009}.radar-picker header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.radar-picker input{box-sizing:border-box;width:100%;background:#08111c;color:#e5edf5;border:1px solid #344256;border-radius:8px;padding:12px;font:16px system-ui}.radar-picker button{color:#e5edf5;background:#182433;border:1px solid #344256;border-radius:8px;padding:10px 12px;min-height:44px;cursor:pointer;font:14px system-ui}.radar-picker-list{display:grid;gap:6px;max-height:55dvh;overflow-y:auto;margin-top:10px}.radar-picker-list button{text-align:left}.radar-picker-list button[aria-current=true]{border-color:#25bf80;background:#123328}.radar-picker button:focus-visible,.radar-picker input:focus-visible{outline:2px solid #25bf80;outline-offset:2px}.radar-picker-trigger{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.radar-quotes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.radar-quote{display:grid;gap:5px;background:#101820;border:1px solid #2a3544;border-radius:8px;padding:12px;color:#e5edf5;min-width:0}.radar-quote strong{font-size:23px;font-variant-numeric:tabular-nums}.radar-quote small,.radar-news small{color:#a1adbd;font:11px/1.5 system-ui}.radar-news{padding:12px;border-bottom:1px solid #303030}.radar-news a{color:#e5edf5;text-decoration:none;font:14px/1.5 system-ui}.radar-news small{display:block;margin-top:5px}@media(min-width:1400px){.radar-quotes{grid-template-columns:repeat(4,minmax(0,1fr))}}`;document.head.append(style);
 window.TraderRadar={prepare,mount,remember,openPicker,quotes};
})();
