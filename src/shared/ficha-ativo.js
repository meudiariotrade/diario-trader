/* v868 — Ficha do ativo (drill-down estilo Bloomberg).
 * Toque longo em qualquer ticker do app (ou botão "Ficha") abre um painel com: preço, sua posição,
 * suas operações naquele ativo, notícias ligadas, fundamentos do snapshot, agenda (último balanço e
 * proventos), vigia de preço e comparação lado a lado. Tudo lido de dados que o app já tem no aparelho;
 * a única consulta externa é a Cloudflare (preço mensal/proventos) e só quando a ficha abre. */
;(function(w,d){
'use strict';
if(!d)return;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(v,c=2)=>v==null||!Number.isFinite(+v)?'—':(+v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c});
const P=(v,c=1)=>v==null||!Number.isFinite(+v)?'—':N(v,c)+'%';
const norm=tk=>String(tk||'').trim().toUpperCase().replace(/\.SA$/,'').replace(/[^A-Z0-9.\-]/g,'').slice(0,12);
const ehBR=tk=>/^[A-Z]{4}\d{1,2}$/.test(tk);
const VIG='dt-vigia-v868',BASE='https://diario-screeners-quant.lucianosilva43567.workers.dev';
let aberto='',ctrl=null,comparar=[];

/* ---------- dados ---------- */
function preco(tk){try{const q=w.TRM?.melhorPx?.(tk);if(q&&q.px>0)return q}catch{}return null}
async function snapshot(m){
 try{const db=await new Promise((ok,no)=>{const r=indexedDB.open('diario-screeners-publicos-v1',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('snapshots'))r.result.createObjectStore('snapshots',{keyPath:'market'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  const rec=await new Promise(ok=>{const q=db.transaction('snapshots','readonly').objectStore('snapshots').get(m);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(null)});db.close();
  return rec?.data?.universe_rows||rec?.data?.rows||[]}catch{return []}
}
async function fund(tk){const rows=await snapshot(ehBR(tk)?'BR':'US');return rows.find(r=>r.ticker===tk)||null}
function posicao(tk){try{return (w.pfCalc?.().pos||[]).find(p=>norm(p.tk)===tk)||null}catch{return null}}
function operacoes(tk){
 let L=[];try{L=(typeof S!=='undefined'&&Array.isArray(S.trades)?S.trades:[]).filter(t=>norm(t.ativo)===tk||norm(t.ativo).startsWith(tk.replace(/\d+$/,''))&&tk.length<=4)}catch{}
 return L.map(t=>{let c=null;try{c=typeof calc==='function'?calc(t):null}catch{}return {t,res:c?.res??null}})
  .sort((a,b)=>String(b.t.dtx||b.t.dt||'').localeCompare(String(a.t.dtx||a.t.dt||'')));
}
function noticias(tk){try{return w.DiarioInteligenciaEtapa1?.noticiasDo?.(tk)||[]}catch{return []}}
async function proventos(tk,signal){
 const r=await fetch(BASE+'/v1/historico-preco?market='+(ehBR(tk)?'BR':'US')+'&ticker='+encodeURIComponent(tk),{signal});
 const j=await r.json().catch(()=>({}));return r.ok&&j.ok?j:null;
}

/* ---------- vigia de preço (memória local, sem rede) ---------- */
const vig=()=>{try{return JSON.parse(localStorage.getItem(VIG)||'{}')||{}}catch{return {}}};
const vigSalvar=v=>{try{localStorage.setItem(VIG,JSON.stringify(v))}catch{}};
function avisar(msg){try{w.toast?.(msg)}catch{}try{if('Notification' in w&&Notification.permission==='granted')new Notification('Diário de Trader',{body:msg,tag:'vigia'})}catch{}}
function conferir(){const v=vig();let mud=false;
 for(const [tk,a] of Object.entries(v)){const q=preco(tk);if(!q)continue;
  if(a.alvo>0&&!a.avAlvo&&q.px>=a.alvo){a.avAlvo=Date.now();mud=true;avisar(tk+' chegou no alvo: '+N(q.px)+' (alvo '+N(a.alvo)+')')}
  if(a.stop>0&&!a.avStop&&q.px<=a.stop){a.avStop=Date.now();mud=true;avisar(tk+' tocou o stop: '+N(q.px)+' (stop '+N(a.stop)+')')}}
 if(mud)vigSalvar(v);
}
// Só lê preços que já estão na memória do app (Profit/WebSocket/cache). Pausa com a tela oculta.
setInterval(()=>{if(!d.hidden&&Object.keys(vig()).length)conferir()},30000);

/* ---------- desenho ---------- */
function linha(r,k,l,f){return r?.[k]==null?'':'<div class="fa-kv"><span>'+E(l)+'</span><b>'+f(r[k])+'</b></div>'}
function fundHtml(tk,r){
 if(!r)return '<p class="fa-mut">Sem fundamentos no snapshot deste aparelho. Abra Análises › Screener uma vez para baixar.</p>';
 const br=ehBR(tk);
 return '<div class="fa-grid">'+(br?linha(r,'pl','P/L',v=>N(v,1)+'x')+linha(r,'pvp','P/VP',v=>N(v,2)+'x')+linha(r,'roe','ROE',P)+linha(r,'dividend_yield','Dividend yield',P)+linha(r,'ev_ebitda','EV/EBITDA',v=>N(v,1)+'x')+linha(r,'score_quant_br','Nota',v=>N(v/10,1)+'/10')
  :linha(r,'roic','ROIC',P)+linha(r,'forward_pe','Forward P/E',v=>N(v,1)+'x')+linha(r,'total_shareholder_yield','Total Yield',P)+linha(r,'fcf_margin','Margem FCF',P)+linha(r,'revenue_growth_yoy','Cresc. receita',P)+linha(r,'score_quant_us','Nota',v=>N(v/10,1)+'/10'))+
  linha(r,'momentum_12_1','Momentum 12m',P)+'</div>';
}
function opsHtml(L){
 if(!L.length)return '<p class="fa-mut">Você ainda não registrou operações neste ativo.</p>';
 const fech=L.filter(x=>x.res!=null),gan=fech.filter(x=>x.res>0).length,tot=fech.reduce((s,x)=>s+x.res,0);
 return '<div class="fa-grid"><div class="fa-kv"><span>Operações</span><b>'+L.length+'</b></div><div class="fa-kv"><span>Acerto</span><b>'+(fech.length?P(gan/fech.length*100,0):'—')+'</b></div><div class="fa-kv"><span>Resultado</span><b class="'+(tot>=0?'fa-pos':'fa-neg')+'">R$ '+N(tot)+'</b></div></div>'+
 '<ul class="fa-list">'+L.slice(0,6).map(x=>'<li><span>'+E(String(x.t.dtx||x.t.dt||'').slice(0,10))+' · '+(x.t.side==='C'?'Compra':'Venda')+(x.t.setup?' · '+E(x.t.setup):'')+'</span><b class="'+(x.res>0?'fa-pos':x.res<0?'fa-neg':'')+'">'+(x.res==null?'aberta':'R$ '+N(x.res))+'</b></li>').join('')+'</ul>';
}
function vigHtml(tk){const a=vig()[tk]||{};
 return '<div class="fa-vig"><label>Alvo<input type="number" inputmode="decimal" step="any" data-fa-vig="alvo" value="'+(a.alvo||'')+'"></label><label>Stop<input type="number" inputmode="decimal" step="any" data-fa-vig="stop" value="'+(a.stop||'')+'"></label><button type="button" data-fa-vig-salvar="1">Salvar</button>'+(a.alvo||a.stop?'<button type="button" data-fa-vig-tirar="1">Remover</button>':'')+'</div>'+
 '<p class="fa-mut">Aviso no app'+('Notification' in w&&Notification.permission!=='granted'?' (toque em Salvar para permitir notificação)':'')+' quando o preço que o app recebe cruzar o alvo ou o stop.</p>';}
function compHtml(base,lista){
 if(!lista.length)return '';
 const cols=[base,...lista];
 const lin=(l,f)=>'<tr><th>'+E(l)+'</th>'+cols.map(c=>'<td>'+f(c)+'</td>').join('')+'</tr>';
 const br=ehBR(base.tk);
 return '<div class="fa-scroll"><table class="fa-comp"><thead><tr><th></th>'+cols.map(c=>'<th>'+E(c.tk)+'</th>').join('')+'</tr></thead><tbody>'+
  lin('Preço',c=>c.q?N(c.q.px):'—')+lin('Dia',c=>c.q?.d1!=null?P(c.q.d1,2):'—')+
  (br?lin('P/L',c=>N(c.f?.pl,1))+lin('P/VP',c=>N(c.f?.pvp,2))+lin('ROE',c=>P(c.f?.roe))+lin('DY',c=>P(c.f?.dividend_yield))
   :lin('ROIC',c=>P(c.f?.roic))+lin('Fwd P/E',c=>N(c.f?.forward_pe,1))+lin('Total Yield',c=>P(c.f?.total_shareholder_yield))+lin('Margem FCF',c=>P(c.f?.fcf_margin)))+
  lin('Momentum 12m',c=>P(c.f?.momentum_12_1))+lin('Nota',c=>{const v=c.f?.[br?'score_quant_br':'score_quant_us'];return v==null?'—':N(v/10,1)})+'</tbody></table></div>';
}
function agendaHtml(f,pv){
 const out=[];
 if(f?.documento_balanco_publicado_em)out.push('<div class="fa-kv"><span>Último balanço ('+E(f.documento_balanco_tipo||'')+')</span><b>'+E(String(f.documento_balanco_publicado_em).slice(0,10).split('-').reverse().join('/'))+'</b></div>');
 if(pv?.dividendos?.length){const ds=pv.dividendos.slice(-6).reverse(),ult=ds[0],ano=pv.dividendos.filter(([t])=>t*1000>Date.now()-365*864e5);
  out.push('<div class="fa-kv"><span>Último provento</span><b>'+new Date(ult[0]*1000).toLocaleDateString('pt-BR')+' · '+N(ult[1],2)+'</b></div><div class="fa-kv"><span>Pagamentos em 12 meses</span><b>'+ano.length+'</b></div>');}
 else if(pv)out.push('<div class="fa-kv"><span>Proventos</span><b>sem registros</b></div>');
 return out.length?'<div class="fa-grid">'+out.join('')+'</div><p class="fa-mut">Datas futuras de balanço e data-com não têm fonte aberta confiável; mostro o último registrado.</p>':'<p class="fa-mut">Carregando…</p>';
}
async function montar(tk){
 const el=d.getElementById('fa-sheet');if(!el)return;
 ctrl?.abort();ctrl=new AbortController();const sig=ctrl.signal;
 const q=preco(tk),pos=posicao(tk),ops=operacoes(tk),nt=noticias(tk);
 const body=el.querySelector('.fa-body');
 const sec=(id,t,h)=>'<section class="fa-sec" data-fa-sec="'+id+'"><h3>'+t+'</h3><div class="fa-in">'+h+'</div></section>';
 body.innerHTML=
  '<header class="fa-head"><div class="fa-tit">'+(w.DiarioLogos?.html?.(tk,28)||'')+'<div><b>'+E(tk)+'</b><small data-fa-nome></small></div></div><div class="fa-px">'+(q?'<b>'+N(q.px)+'</b><small class="'+((q.d1||0)>=0?'fa-pos':'fa-neg')+'">'+(q.d1!=null?P(q.d1,2):'')+' · '+E(q.fonte||'')+'</small>':'<small>Sem preço ao vivo agora</small>')+'</div></header>'+
  '<div class="fa-acts"><button type="button" data-fa-ir="hist">Avaliação 10 anos</button><button type="button" data-fa-ir="tec">Técnico</button><button type="button" data-fa-ir="pesq">Pesquisa com IA</button><button type="button" data-fa-ir="term">Gráfico no Terminal</button></div>'+
  (pos?sec('pos','Sua posição','<div class="fa-grid"><div class="fa-kv"><span>Quantidade</span><b>'+N(pos.q,0)+'</b></div><div class="fa-kv"><span>Valor</span><b>'+N(pos.v)+'</b></div><div class="fa-kv"><span>Peso na carteira</span><b>'+P(pos.peso)+'</b></div></div>'):'')+
  sec('ops','Suas operações',opsHtml(ops))+
  sec('fund','Fundamentos','<p class="fa-mut">Carregando…</p>')+
  sec('agenda','Agenda e proventos','<p class="fa-mut">Carregando…</p>')+
  sec('news','Notícias ligadas',nt.length?'<ul class="fa-news">'+nt.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul>':'<p class="fa-mut">Nenhuma notícia recente ligada a este ativo.</p>')+
  sec('vig','Vigia de preço',vigHtml(tk))+
  sec('comp','Comparar','<div class="fa-vig"><label>Ticker<input type="text" data-fa-comp-in placeholder="'+(ehBR(tk)?'VALE3':'MSFT')+'" autocapitalize="characters" autocomplete="off"></label><button type="button" data-fa-comp-add="1">Adicionar</button>'+(comparar.length?'<button type="button" data-fa-comp-limpar="1">Limpar</button>':'')+'</div><div data-fa-comp></div>');
 const f=await fund(tk);if(sig.aborted||aberto!==tk)return;
 const nm=body.querySelector('[data-fa-nome]');if(nm)nm.textContent=f?.empresa||f?.company_name||'';
 body.querySelector('[data-fa-sec="fund"] .fa-in').innerHTML=fundHtml(tk,f);
 body.querySelector('[data-fa-sec="agenda"] .fa-in').innerHTML=agendaHtml(f,null);
 pintaComp(tk,f);
 proventos(tk,sig).then(pv=>{if(!sig.aborted&&aberto===tk)body.querySelector('[data-fa-sec="agenda"] .fa-in').innerHTML=agendaHtml(f,pv)}).catch(()=>{});
}
async function pintaComp(tk,f){
 const box=d.querySelector('#fa-sheet [data-fa-comp]');if(!box)return;
 const lista=[];for(const c of comparar)if(c!==tk)lista.push({tk:c,q:preco(c),f:await fund(c)});
 if(aberto!==tk)return;box.innerHTML=compHtml({tk,q:preco(tk),f},lista);
}
function abrir(tk){
 const t=norm(tk);if(!t)return;aberto=t;comparar=comparar.filter(x=>ehBR(x)===ehBR(t));
 let el=d.getElementById('fa-sheet');
 if(!el){el=d.createElement('div');el.id='fa-sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Ficha do ativo');
  el.innerHTML='<div class="fa-fundo" data-fa-fechar="1"></div><div class="fa-painel"><div class="fa-barra"><span>Ficha do ativo</span><button type="button" data-fa-fechar="1" aria-label="Fechar">Fechar</button></div><div class="fa-body"></div></div>';d.body.appendChild(el)}
 d.body.classList.add('fa-on');montar(t);
}
function fechar(){ctrl?.abort();ctrl=null;aberto='';d.getElementById('fa-sheet')?.remove();d.body.classList.remove('fa-on')}

/* ---------- gestos: toque longo em qualquer ticker abre a ficha ---------- */
const SEL='[data-fa-tk],[data-tk],[data-ticker],[data-scr-detail],[data-tech-detail],[data-hf-abrir]';
const tkDe=a=>a.getAttribute('data-fa-tk')||a.getAttribute('data-tk')||a.getAttribute('data-ticker')||a.getAttribute('data-scr-detail')||a.getAttribute('data-tech-detail')||a.getAttribute('data-hf-abrir');
let pressT=0,pressXY=null,engoleClique=false;
d.addEventListener('pointerdown',e=>{const a=e.target.closest?.(SEL);if(!a||a.closest('#fa-sheet')||a.closest('#trm,#terminal,.trm-root'))return;
 pressXY=[e.clientX,e.clientY];clearTimeout(pressT);pressT=setTimeout(()=>{const tk=norm(tkDe(a));if(!tk)return;engoleClique=true;try{navigator.vibrate?.(12)}catch{}abrir(tk)},520)},{passive:true});
const cancela=e=>{if(e?.type==='pointermove'&&pressXY&&Math.hypot(e.clientX-pressXY[0],e.clientY-pressXY[1])<10)return;clearTimeout(pressT)};
d.addEventListener('pointerup',cancela,{passive:true});d.addEventListener('pointercancel',cancela,{passive:true});d.addEventListener('pointermove',cancela,{passive:true});
d.addEventListener('contextmenu',e=>{if(e.target.closest?.(SEL)&&!e.target.closest('#fa-sheet'))e.preventDefault()});
d.addEventListener('click',e=>{
 if(engoleClique){engoleClique=false;if(!e.target.closest('#fa-sheet')){e.preventDefault();e.stopPropagation();return}}
 const b=e.target.closest?.('[data-fa-abrir]');if(b){e.preventDefault();e.stopPropagation();abrir(b.dataset.faAbrir);return}
 const s=e.target.closest?.('#fa-sheet');if(!s)return;
 if(e.target.closest('[data-fa-fechar]')){e.preventDefault();fechar();return}
 const ir=e.target.closest('[data-fa-ir]');
 if(ir){const tk=aberto,to=ir.dataset.faIr;fechar();
  if(to==='hist')w.DiarioHistoricoFundamentos?.abrir(tk,posicao(tk),ehBR(tk)?'BR':'US');
  else if(to==='term'){try{w.irPara?.('term');setTimeout(()=>w.trRoda?.(tk+' G'),300)}catch{}}
  else{w.DiarioColorLink?.publicar('ficha',tk);try{w.irPara?.('analises');setTimeout(()=>{const sub=to==='pesq'?'pesquisa':(ehBR(tk)?'tecnico-br':'tecnico-world');d.querySelector('[data-an-sub="'+sub+'"]')?.click()},250)}catch{}}
  return}
 if(e.target.closest('[data-fa-vig-salvar]')){const v=vig(),num=k=>Number(String(s.querySelector('[data-fa-vig="'+k+'"]')?.value||'').replace(',','.'))||0;
  v[aberto]={alvo:num('alvo'),stop:num('stop')};if(!v[aberto].alvo&&!v[aberto].stop)delete v[aberto];vigSalvar(v);
  try{if('Notification' in w&&Notification.permission==='default')Notification.requestPermission()}catch{}
  s.querySelector('[data-fa-sec="vig"] .fa-in').innerHTML=vigHtml(aberto);try{w.toast?.('Vigia salvo para '+aberto)}catch{};return}
 if(e.target.closest('[data-fa-vig-tirar]')){const v=vig();delete v[aberto];vigSalvar(v);s.querySelector('[data-fa-sec="vig"] .fa-in').innerHTML=vigHtml(aberto);return}
 if(e.target.closest('[data-fa-comp-add]')){const inp=s.querySelector('[data-fa-comp-in]'),t=norm(inp?.value);if(t&&t!==aberto&&!comparar.includes(t)){comparar=[...comparar,t].slice(-2)}if(inp)inp.value='';fund(aberto).then(f=>pintaComp(aberto,f));return}
 if(e.target.closest('[data-fa-comp-limpar]')){comparar=[];const box=s.querySelector('[data-fa-comp]');if(box)box.innerHTML='';return}
},true);
d.addEventListener('keydown',e=>{if(e.key==='Escape'&&aberto)fechar();if(e.key==='Enter'&&e.target.matches?.('[data-fa-comp-in]')){e.preventDefault();d.querySelector('#fa-sheet [data-fa-comp-add]')?.click()}});

const css=d.createElement('style');css.textContent=`
#fa-sheet{position:fixed;inset:0;z-index:2147482000}
#fa-sheet .fa-fundo{position:absolute;inset:0;background:rgba(8,9,13,.55)}
#fa-sheet .fa-painel{position:absolute;left:0;right:0;bottom:0;max-height:88vh;overflow:auto;background:#12151E;color:#E2E8F0;border-top:1px solid rgba(255,255,255,.06);border-radius:6px 6px 0 0;padding:0 14px calc(14px + env(safe-area-inset-bottom));font-variant-numeric:tabular-nums;overscroll-behavior:contain}
@media(min-width:900px){#fa-sheet .fa-painel{left:auto;top:0;bottom:0;width:460px;max-height:none;border-radius:0;border-left:1px solid #1E232E;border-top:0;padding-top:env(safe-area-inset-top)}}
.fa-barra{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;background:#12151E;padding:10px 0;border-bottom:1px solid #1E232E;z-index:1}.fa-barra span{color:#64748B;font-size:12px}
#fa-sheet button{min-height:40px;padding:8px 12px;border-radius:4px;border:1px solid #1E232E;background:#181C28;color:#E2E8F0;font-size:14px}
.fa-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 0}.fa-tit{display:flex;gap:8px;align-items:center;min-width:0}.fa-tit b{font-size:20px;color:#fff}.fa-tit small{display:block;color:#64748B;font-size:12px}
.fa-px{text-align:right}.fa-px b{display:block;font-size:20px;color:#fff}.fa-px small{font-size:12px;color:#64748B}
.fa-acts{display:flex;flex-wrap:wrap;gap:6px;padding-bottom:10px;border-bottom:1px solid #1E232E}
.fa-sec{padding:12px 0;border-bottom:1px solid #1E232E}.fa-sec h3{margin:0 0 8px;font-size:13px;color:#E2E8F0;font-weight:600}
.fa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px}.fa-kv{display:flex;justify-content:space-between;gap:8px;min-width:0;font-size:13px}.fa-kv span{color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fa-kv b{color:#fff;text-align:right;white-space:nowrap}
.fa-pos{color:#10B981!important}.fa-neg{color:#EF4444!important}.fa-mut{color:#64748B;font-size:12px;margin:6px 0 0}
.fa-list,.fa-news{list-style:none;margin:8px 0 0;padding:0}.fa-list li{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:6px 0;border-bottom:1px solid #1E232E}
.fa-news li{font-size:13px;padding:6px 0;border-bottom:1px solid #1E232E;color:#E2E8F0}
.fa-vig{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}.fa-vig label{display:flex;flex-direction:column;font-size:12px;color:#64748B;flex:1 1 100px;min-width:0}.fa-vig input{font-size:16px;min-height:40px;padding:6px 8px;border-radius:4px;border:1px solid #1E232E;background:#08090D;color:#fff}
.fa-scroll{overflow-x:auto;margin-top:8px}.fa-comp{border-collapse:collapse;width:100%;font-size:13px}.fa-comp th,.fa-comp td{padding:6px 8px;border-bottom:1px solid #1E232E;white-space:nowrap}.fa-comp th{text-align:left;color:#64748B;font-weight:500}.fa-comp td{text-align:right;color:#fff}.fa-comp thead th{color:#F59E0B;text-align:right}.fa-comp thead th:first-child{text-align:left}
body.fa-on{overflow:hidden}
html.tema-claro #fa-sheet .fa-painel,body.light #fa-sheet .fa-painel{background:#fff;color:#0F172A}`;
d.head.appendChild(css);
w.DiarioFicha=Object.freeze({abrir,fechar,vigia:vig,conferir});
})(typeof window!=='undefined'?window:globalThis,typeof document!=='undefined'?document:null);
