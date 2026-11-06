/* Diário de Trader v423 — acabamento: boas-vindas coerentes, central de avisos no sino,
 * e Terminal mais limpo no celular. Só interface; não muda cálculos nem dados salvos. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=n=>Number.isFinite(+n)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(+n):'—';
const num=v=>+String(v||'').replace(/\./g,'').replace(',','.')||0;

/* ---------- A. Boas-vindas ---------- */
// O app usa capital × risco × máximo de trades como perda do dia quando o campo fica vazio.
function wrapOnb(){
  if(typeof root.onbHtml!=='function'||root.onbHtml.__v423)return;
  const prev=root.onbHtml;
  const f=function(){
    let h=prev.apply(this,arguments);
    h=h.replace('data-onb="cap" placeholder="10000"','data-onb="cap" placeholder="ex.: 10.000"')
       .replace('data-onb="pd" placeholder="200"','data-onb="pd" placeholder="automático"')
       .replace(/(<label>Máximo de trades no dia<input[^>]*><\/label><\/div>)/,'$1<p class="v423-onbhint" id="v423-onbhint" aria-live="polite"></p>');
    return h;
  };
  f.__v423=1;root.onbHtml=f;
}
function onbDom(){
  const box=doc.getElementById('onb');if(!box)return;
  const cap=box.querySelector('input[data-onb="cap"]'),pd=box.querySelector('input[data-onb="pd"]'),nt=box.querySelector('input[data-onb="nt"]');
  if(cap&&cap.placeholder==='10000')cap.placeholder='ex.: 10.000';
  if(pd&&pd.placeholder==='200')pd.placeholder='automático';
  if(nt&&!doc.getElementById('v423-onbhint')){const p=doc.createElement('p');p.className='v423-onbhint';p.id='v423-onbhint';p.setAttribute('aria-live','polite');(nt.closest('.g2')||nt.parentElement).after(p)}
}
function onbHint(){onbDom();
  const box=doc.getElementById('onb');const hint=doc.getElementById('v423-onbhint');if(!box||!hint)return;
  const v=k=>box.querySelector(`input[data-onb="${k}"]`)?.value;
  const cap=num(v('cap'))||10000,pct=Math.min(num(v('pct'))||1,10),nt=Math.round(num(v('nt'))||3),pd=num(v('pd'));
  const auto=cap*pct/100*nt;
  hint.innerHTML=pd>0
    ?`O dia trava ao perder <b>${brl(pd)}</b>. Risco por trade: <b>${brl(cap*pct/100)}</b>.`
    :`Sem perda máxima preenchida, o app usa <b>${brl(auto)}</b> por dia (${brl(cap*pct/100)} de risco × ${nt} trades)${num(v('cap'))?'':', com capital de exemplo de R$ 10.000'}.`;
}
doc.addEventListener('input',e=>{if(e.target.closest?.('#onb [data-onb]'))onbHint()});

/* ---------- B. Central de avisos (sino) ---------- */
function items(){
  const out=[];const t=g(()=>loc().slice(0,10),new Date().toISOString().slice(0,10));
  // trava / atenção do dia
  try{const ph=pHoje(),c=pCore(ph.hj,ph.P);
    if(c.mot.length)out.push({k:'r',ic:'⛔',t:'Pare por hoje',d:c.mot.join(' · '),go:'dia'});
    else if(c.perda>=c.lim*.8)out.push({k:'a',ic:'⚠️',t:'Perto do limite de perda',d:`Perda ${brl(c.perda)} de ${brl(c.lim)}`,go:'dia'});
  }catch(e){}
  // escala de turno
  try{if(turnoNv(t)!=='g'){const x=turnoTxt(t);if(x)out.push({k:'a',ic:'🏭',t:'Escala de turno hoje',d:x,go:'home'})}}catch(e){}
  // checklist
  try{const rs=S.rules||[],chk=(S.days[t]||{}).chk||{};const n=rs.filter(r=>chk[r.id]).length;if(rs.length&&n<rs.length)out.push({k:'i',ic:'☑️',t:'Checklist do dia',d:`${n} de ${rs.length} regras marcadas`,go:'dia'})}catch(e){}
  // alertas de preço
  try{const al=(S.ax?.alpx||[]);const fired=al.filter(a=>a.fired&&String(new Date(a.fired).toISOString()).slice(0,10)===t),wait=al.filter(a=>!a.fired);
    fired.forEach(a=>out.push({k:'g',ic:'🔔',t:`Alerta disparou: ${a.c}`,d:`${a.op==='>'?'acima de':'abaixo de'} ${a.v}`,mkt:'cq'}));
    if(wait.length)out.push({k:'i',ic:'🔔',t:'Alertas de preço ativos',d:`${wait.length} esperando`,mkt:'cq'});
  }catch(e){}
  // agenda de alto impacto ainda hoje
  try{const now=Date.now();const ev=(AG.v[0]?.eventos||[]).filter(e=>e.imp===1&&Date.parse(e.em)>now-30*6e4&&String(e.em).slice(0,10)===t).sort((a,b)=>Date.parse(a.em)-Date.parse(b.em)).slice(0,4);
    ev.forEach(e=>out.push({k:'i',ic:'📅',t:new Date(e.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'})+' · '+(e.t||'Evento'),d:(e.p?e.p+' · ':'')+'alto impacto',mkt:'ag'}))}catch(e){}
  // debriefing depois do pregão
  try{const h=+new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}).format(new Date());const d=S.days[t]||{};const tr=(S.trades||[]).some(x=>String(x.dt||'').slice(0,10)===t);
    if(h>=18&&tr&&!d.resumo)out.push({k:'i',ic:'📝',t:'Debriefing pendente',d:'Você operou hoje e ainda não fechou o dia',deb:1})}catch(e){}
  return out;
}
function panel(){
  const it=items();
  let el=doc.getElementById('v423-bell');
  if(!el){el=doc.createElement('div');el.id='v423-bell';el.className='v423-bell';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Avisos');doc.body.appendChild(el)}
  el.innerHTML=`<button type="button" class="v423-bell-bg" data-v423-close aria-label="Fechar avisos"></button><section class="v423-bell-panel"><header><h2>Avisos de hoje</h2><button type="button" data-v423-close aria-label="Fechar">✕</button></header>
   ${it.length?`<ul>${it.map(x=>`<li class="v423-${x.k}"><button type="button" ${x.go?`data-v423-go="${x.go}"`:x.mkt?`data-v423-mkt="${x.mkt}"`:x.deb?'data-v423-deb="1"':''}><span class="ic" aria-hidden="true">${x.ic}</span><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span><i aria-hidden="true">›</i></button></li>`).join('')}</ul>`:'<p class="v423-none">Nenhum aviso agora. Tudo dentro do plano.</p>'}
   <footer><button type="button" data-v423-go="mais">Configurar alertas e notificações</button></footer></section>`;
  el.hidden=false;doc.body.classList.add('v423-bell-open');
  el.querySelector('.v423-bell-panel button')?.focus({preventScroll:true});
}
function close(){const el=doc.getElementById('v423-bell');if(el)el.hidden=true;doc.body.classList.remove('v423-bell-open')}
function badge(){
  const b=doc.querySelector('[aria-label="Abrir notificações"]');if(!b)return;
  const n=g(()=>items().filter(x=>x.k==='r'||x.k==='a'||x.k==='g').length,0);
  b.classList.toggle('v423-has',n>0);b.setAttribute('aria-label','Abrir notificações');b.title=n?`${n} aviso(s) importante(s)`:'Avisos';
}
// captura antes da camada v402 (que levava o sino para Configurações)
root.addEventListener('click',e=>{
  const bell=e.target.closest?.('[aria-label="Abrir notificações"]');
  if(bell){e.preventDefault();e.stopImmediatePropagation();panel();return}
  const pnl=e.target.closest?.('#v423-bell');if(!pnl)return;
  if(e.target.closest('[data-v423-close]')){e.preventDefault();close();return}
  const go=e.target.closest('[data-v423-go]');
  if(go){e.preventDefault();e.stopImmediatePropagation();close();try{tab=go.dataset.v423Go;render();scrollTo(0,0)}catch(x){}return}
  const m=e.target.closest('[data-v423-mkt]');
  if(m){e.preventDefault();e.stopImmediatePropagation();close();try{if(root.DIARIO_NAV?.navigate)root.DIARIO_NAV.navigate('mercado:'+m.dataset.v423Mkt);else{MKT.tab=m.dataset.v423Mkt;tab='mercado';render()}scrollTo(0,0)}catch(x){}return}
  if(e.target.closest('[data-v423-deb]')){e.preventDefault();e.stopImmediatePropagation();close();try{GOR.deb();scrollTo(0,0)}catch(x){}}
},true);
doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&doc.body.classList.contains('v423-bell-open'))close()});

/* ---------- D. Terminal no celular: rótulos curtos nos botões ---------- */
function terminalLabels(){
  if(g(()=>tab,'')!=='term')return;
  doc.querySelectorAll('#app .trbar .trbtn').forEach(b=>{
    if(b.dataset.v423)return;const t=(b.textContent||'').trim();
    if(/^\+\s*Painel$/i.test(t)){b.dataset.v423='1';b.setAttribute('aria-label','Novo painel');b.innerHTML='<span class="v423-short">+</span><span class="v423-long">+ Painel</span>'}
    else if(/Menu$/i.test(t)){b.dataset.v423='1';b.setAttribute('aria-label','Menu do Terminal');b.innerHTML='<span class="v423-short">☰</span><span class="v423-long">☰ Menu</span>'}
  });
}

/* ---------- montagem ---------- */
function after(){wrapOnb();onbHint();badge();terminalLabels()}
function hook(){
  if(typeof root.render0!=='function'||root.render0.__v423)return false;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{after()}catch(e){}return o};f.__v423=1;root.render0=f;return true;
}
wrapOnb();hook();
let k=0;const iv=setInterval(()=>{k++;wrapOnb();hook();try{after()}catch(e){}if(k>10)clearInterval(iv)},700);
setInterval(()=>{if(!doc.hidden){try{badge();terminalLabels()}catch(e){}}},20000);
root.DIARIO_V423={items,panel};
})(window);
