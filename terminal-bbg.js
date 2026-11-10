/* v543 — Terminal no estilo Bloomberg: teclas de mercado, menu do ativo, número + GO, tecla Menu, barra de status,
   tela cheia e as funções HP (histórico de preços) e FXC (matriz de moedas). Só acrescenta; reutiliza os comandos existentes. */
(function(root,doc){
 'use strict';
 if(root.DiarioTerminalBBG)return;
 const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch{return d}};
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const app=()=>doc.querySelector('#app:not(.v503-fantasma)');
 const noTerminal=()=>g(()=>tab,'')==='term';
 const permitido=c=>!root.TerminalCommandPolicy||root.TerminalCommandPolicy.allows(c);
 const nf=(v,c=2)=>Number.isFinite(+v)?(+v).toLocaleString('pt-BR',{minimumFractionDigits:c,maximumFractionDigits:c}):'—';

 /* ---------- funções novas ---------- */
 const PARES=[['BRL','FX_IDC:USDBRL',0],['EUR','FX_IDC:EURUSD',1],['GBP','FX_IDC:GBPUSD',1],['JPY','FX_IDC:USDJPY',0],['CHF','FX_IDC:USDCHF',0],['CAD','FX_IDC:USDCAD',0],['AUD','FX_IDC:AUDUSD',1],['MXN','FX_IDC:USDMXN',0],['CNY','FX_IDC:USDCNH',0]];
 const FXS={s:PARES.map(p=>p[1])};
 function registra(){
  const T=root.TRM;if(!T||!T.FN||!T.EXT||!T.FN_TK||T.EXT.HP)return;
  T.FN_TK.HP='Histórico de preços (tabela diária)';
  T.EXT.HP={tk:true,load:async q=>{await T.trCandles(q.tk,'1d')},body:q=>{
   const d=g(()=>T.TR.dados['cd|'+q.tk+'|1d'].v,null),erro=g(()=>T.TR.err['cd|'+q.tk+'|1d'],'');
   if(!d||!Array.isArray(d.candles)||!d.candles.length)return T.carregando(erro||'Buscando histórico de '+q.tk+'…');
   const L=d.candles.slice(-61),linhas=[];let max=-Infinity,min=Infinity;
   for(let i=L.length-1;i>=1;i--){const [t,o,h,l,c,v]=L[i],ant=L[i-1][4],var1=ant?(c/ant-1)*100:NaN;max=Math.max(max,h);min=Math.min(min,l);
    linhas.push(`<tr><td>${new Date(t*1000).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td><td class="num">${nf(o)}</td><td class="num">${nf(h)}</td><td class="num">${nf(l)}</td><td class="num"><b>${nf(c)}</b></td><td class="num ${var1>0?'tg':var1<0?'tr':''}">${Number.isFinite(var1)?(var1>0?'+':'')+nf(var1)+'%':'—'}</td><td class="num">${v?Math.round(v).toLocaleString('pt-BR'):'—'}</td></tr>`)}
   const ini=L[1]?.[4],fim=L[L.length-1][4],per=ini?(fim/ini-1)*100:NaN;
   return T.cabAtivo(q.tk)+`<div class="trsec">Histórico de preços · ${linhas.length} pregões</div><p class="trnote">Máxima ${nf(max)} · mínima ${nf(min)} · no período ${Number.isFinite(per)?(per>0?'+':'')+nf(per)+'%':'—'}</p>`+T.tabela(['Data','Abertura','Máxima','Mínima','Fechamento','Var.','Volume'],linhas,'hp-'+q.tk)+`<p class="trnote">${esc(d.fonte||'Yahoo Finance')} (com atraso)${d.nota?' · '+esc(d.nota):''}</p>`;
  }};
  T.FN.FXC='Matriz de moedas: quanto vale cada moeda nas outras';
  T.EXT.FXC={vivo:true,load:async()=>{if(!doc.hidden)await T.trFn('cot',FXS,3e4)},body:()=>{
   const r=T.trGet('cot',FXS),it=r.v?.itens;if(!it)return T.carregando(r.err||'Consultando moedas…');
   const usd={USD:1};for(const [m,s,inv]of PARES){const x=it.find(i=>i.pedido===s||i.s===s),px=+x?.px;if(px>0)usd[m]=inv?1/px:px}
   const M=Object.keys(usd);if(M.length<3)return T.carregando('Moedas indisponíveis agora.');
   const linhas=M.map(a=>`<tr><td class="tk">1 ${a}</td>${M.map(b=>a===b?'<td class="num mut">—</td>':`<td class="num">${nf(usd[b]/usd[a],usd[b]/usd[a]>=20?2:4)}</td>`).join('')}</tr>`);
   return `<div class="trsec">Matriz de moedas</div><p class="trnote">Leia na linha: 1 unidade da moeda da esquerda vale quanto em cada coluna.</p>`+T.tabela(['',...M],linhas,'fxc')+`<p class="trnote">Calculado a partir dos pares contra o dólar · TradingView</p>`;
  }};
  if(T.ALIAS){T.ALIAS.WEIF=T.ALIAS.WEIF||'WEI';T.ALIAS.MATRIZ=T.ALIAS.MATRIZ||'FXC'}
 }

 /* ---------- menus numerados ---------- */
 const SETORES=[
  ['AÇÕES',[['MOST','Mais negociadas'],['MOST ALTA','Maiores altas'],['MOST BAIXA','Maiores baixas'],['IMAP','Mapa de calor da B3'],['SETORES','Setores'],['EQS','Filtro de ações'],['ADR','ADRs brasileiras'],['TECH','Perto de suporte ou resistência'],['PESQ','Comparar empresas'],['PORT','Sua carteira']]],
  ['ÍNDICES',[['WEI','Bolsas do mundo e futuros'],['GLOBAL','Radar global'],['WMAP','Mapa mundial'],['MON','Seu monitor'],['REL','Relações entre mercados']]],
  ['MOEDAS',[['FX','Moedas'],['FXC','Matriz de moedas'],['CRYP','Cripto ao vivo']]],
  ['COMMOD',[['CMDTY','Commodities'],['HIST','Biblioteca histórica']]],
  ['JUROS',[['DIFUT','Curva DI'],['GC','Curvas de juros (DI e Treasuries)'],['BTMM','Juros e mercado monetário'],['WIRP','Probabilidade do Copom e do Fed'],['CENB','Bancos centrais'],['TD','Tesouro Direto']]],
  ['ECONOMIA',[['ECO','Agenda econômica'],['ECST','Indicadores de 6 países'],['ECFC','Projeções do Focus'],['CEN','Cenários'],['EVT','Eventos relevantes']]],
  ['NOTÍCIAS',[['TOP','Manchetes'],['FIRST','Agências'],['NEWSBR','Brasil'],['NEWSUS','EUA e mundo'],['NEWS','Central de notícias']]],
 ];
 const DO_ATIVO=['DES','GP','GIP','N','FA','ERN','DVD','HP','ANR','RV','OMON','OV','TRAN'];
 let menu=null;
 const ehAtivo=v=>{const s=String(v||'').trim().toUpperCase();if(!/^([A-Z]{4}\d{1,2}|WINFUT|WDOFUT|INDFUT|DOLFUT)$/.test(s))return '';const T=root.TRM;return T&&(T.FN[s]||T.ALIAS?.[s]||T.EXT[s])?'':s};
 function menuAtivo(tk){
  const T=root.TRM,nomes=T?.FN_TK||{};
  menu={titulo:tk,sub:'Funções do ativo',tk,itens:DO_ATIVO.filter(f=>nomes[f]&&permitido(tk+' '+f)).map(f=>({code:tk+' '+f,sigla:f,label:String(nomes[f]).split(' · ')[0]}))};
  g(()=>T.trFn('cot',{s:[tk]},15e3).then(()=>{if(menu&&menu.tk===tk)desenhaMenu()}));
  desenhaMenu();
 }
 function menuSetor(i){
  const [nome,L]=SETORES[i],T=root.TRM;
  menu={titulo:nome,sub:'Mercado',setor:i,itens:L.filter(([c])=>{const k=c.split(' ')[0];return T&&(T.FN[k]||T.EXT[k])&&permitido(c)}).map(([c,l])=>({code:c,sigla:c,label:l}))};
  desenhaMenu();
 }
 function fechaMenu(){menu=null;desenhaMenu()}
 function desenhaMenu(){
  const a=app(),trm=a?.querySelector('.trm');let box=doc.getElementById('bbg-menu');
  if(!menu||!trm||!noTerminal()){box?.remove();for(const b of doc.querySelectorAll('#bbg-keys [data-bbg-setor]'))b.setAttribute('aria-pressed','false');return}
  if(!box){box=el('section',null,'bbg-menu');box.id='bbg-menu';box.setAttribute('aria-live','polite')}
  const alvo=trm.querySelector('#bbg-keys');if(box.previousElementSibling!==alvo)alvo?alvo.after(box):trm.prepend(box);
  let cot='';if(menu.tk){const T=root.TRM,r=g(()=>T.trGet('cot',{s:[menu.tk]}),null),x=r?.v?.itens?.[0];if(x&&x.px!=null)cot=`<span class="bbg-cot"><b>${nf(x.px)}</b> <i class="${x.d1>0?'up':x.d1<0?'dn':''}">${Number.isFinite(+x.d1)?(x.d1>0?'+':'')+nf(x.d1)+'%':''}</i> <small>${esc(x.n||'')}</small></span>`}
  box.innerHTML=`<header><div><small>${esc(menu.sub)}</small><h3>${esc(menu.titulo)}</h3>${cot}</div><button type="button" class="bbg-x" data-bbg-fecha aria-label="Fechar menu">MENU ✕</button></header>
<div class="bbg-lista">${menu.itens.map((it,i)=>`<button type="button" class="bbg-item" data-bbg-item="${i}"><span class="bbg-n">${i+1})</span><span class="bbg-l">${esc(it.label)}</span><span class="bbg-c">${esc(it.sigla)}</span></button>`).join('')||'<p class="bbg-vazio">Nenhuma função disponível.</p>'}</div>
<footer>Digite o número e GO, ou toque na linha · MENU volta</footer>`;
  for(const b of doc.querySelectorAll('#bbg-keys [data-bbg-setor]'))b.setAttribute('aria-pressed',String(menu.setor===+b.dataset.bbgSetor));
 }
 function roda(code){
  fechaMenu();
  g(()=>root.TraderTerminalV413?.view('advanced'));
  if(root.DiarioTerminalTools?.run)root.DiarioTerminalTools.run(code);else g(()=>root.TRM.roda(code));
 }
 /* número + GO: escolhe a linha do menu aberto ou do Menu de funções */
 function porNumero(n){
  if(menu){const it=menu.itens[n-1];if(it){roda(it.code);return true}return false}
  const linhas=[...(app()?.querySelectorAll('#terminal-inicio .ti539-row')||[])].filter(b=>b.offsetParent&&+b.querySelector('.ti539-number')?.textContent===n);
  if(linhas[0]){linhas[0].click();return true}return false;
 }
 /* devolve true quando o comando foi tratado aqui */
 function trata(valor){
  const v=String(valor||'').trim();if(!v)return false;
  if(/^\d{1,2}$/.test(v))return porNumero(+v);
  if(/^(MENU|VOLTAR)$/i.test(v)&&menu){fechaMenu();return true}
  const m=/^(\S+)\s+MENU$/i.exec(v),tk=ehAtivo(m?m[1]:v);
  if(tk){menuAtivo(tk);return true}
  return false;
 }

 /* ---------- faixa de teclas ---------- */
 const CHEIA='diario-bbg-cheia';
 const cheia=()=>g(()=>localStorage.getItem(CHEIA)==='1',false);
 function teclas(trm){
  let k=trm.querySelector('#bbg-keys');
  if(!k){
   k=el('div',null,'bbg-keys');k.id='bbg-keys';k.setAttribute('role','toolbar');k.setAttribute('aria-label','Mercados e comandos');
   const m=el('button','MENU','bbg-k bbg-menu-k');m.type='button';m.dataset.bbgVoltar='1';m.title='Volta ao Menu de funções (Esc)';k.append(m);
   SETORES.forEach(([nome],i)=>{const b=el('button',nome,'bbg-k bbg-amarela');b.type='button';b.dataset.bbgSetor=i;b.setAttribute('aria-pressed','false');k.append(b)});
   const f=el('form',null,'bbg-cmdw');f.setAttribute('role','search');
   const inp=el('input',null,'bbg-cmd');inp.id='bbg-cmd';inp.autocomplete='off';inp.spellcheck=false;inp.setAttribute('autocapitalize','characters');inp.setAttribute('aria-label','Linha de comando');inp.placeholder='PETR4 <GO> · WEI · ECO · 3';inp.setAttribute('list','bbg-lista-cmd');
   const go=el('button','GO','bbg-go');go.type='submit';f.append(inp,go);k.append(f);
   const t=el('button','','bbg-k bbg-cheia');t.type='button';t.dataset.bbgCheia='1';k.append(t);
   const dl=el('datalist');dl.id='bbg-lista-cmd';k.append(dl);
  }
  const nav=trm.querySelector('#tf413 .tf415-nav');if(nav){if(k.previousElementSibling!==nav)nav.after(k)}else if(!k.isConnected)trm.prepend(k);
  const t=k.querySelector('[data-bbg-cheia]'),rot=cheia()?'✕ Sair da tela cheia':'⛶ Tela cheia';if(t.textContent!==rot)t.textContent=rot;
  const dl=k.querySelector('datalist');
  if(!dl.childElementCount&&root.TRM?.FN){for(const [c,d]of Object.entries(root.TRM.FN)){if(typeof d!=='string'||!permitido(c))continue;const o=el('option');o.value=c;o.label=d.split(' · ')[0];dl.append(o)}}
 }
 /* ---------- barra de status ---------- */
 const hm=(tz)=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const o={};for(const x of p)o[x.type]=x.value;return{d:o.weekday,m:(+o.hour)*60+(+o.minute)}};
 const aberto=(tz,ini,fim)=>{const x=hm(tz);return !/Sat|Sun/.test(x.d)&&x.m>=ini&&x.m<fim};
 function status(trm){
  let s=trm.querySelector('#bbg-status');
  if(!s){s=el('div',null,'bbg-status');s.id='bbg-status';s.setAttribute('role','status');s.append(el('span','','bbg-hora'),el('span','','bbg-b3'),el('span','','bbg-ny'),el('span','','bbg-fontes'),el('span','F2 comando · Esc menu','bbg-dica'));trm.append(s)}
  const [hora,b3,ny,fontes]=s.children;
  const agora=new Date().toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})+' BRT';if(hora.textContent!==agora)hora.textContent=agora;
  const sB3=aberto('America/Sao_Paulo',600,1075),sNY=aberto('America/New_York',570,960);
  const tb='B3 '+(sB3?'ABERTA':'FECHADA'),tn='NY '+(sNY?'ABERTA':'FECHADA');
  if(b3.textContent!==tb)b3.textContent=tb;b3.className='bbg-b3 '+(sB3?'on':'off');if(ny.textContent!==tn)ny.textContent=tn;ny.className='bbg-ny '+(sNY?'on':'off');
  const f=String(g(()=>root.TRM.statusFontes(),'')).replace(/<button[\s\S]*?<\/button>/g,'').replace(/<[^>]+>/g,'').replace(/\s*·\s*·\s*/g,' · ').replace(/\s+/g,' ').trim().slice(0,90);if(fontes.textContent!==f)fontes.textContent=f;
 }

 /* ---------- montagem ---------- */
 let fila=false;
 function monta(){
  fila=false;registra();
  const on=noTerminal(),a=app(),trm=on?a?.querySelector('.trm'):null;
  const full=on&&cheia();if(doc.body.classList.contains('bbg-full')!==full)doc.body.classList.toggle('bbg-full',full);
  if(!trm){if(menu){menu=null;doc.getElementById('bbg-menu')?.remove()}return}
  if(!trm.classList.contains('bbg'))trm.classList.add('bbg');
  teclas(trm);status(trm);if(menu&&!doc.getElementById('bbg-menu'))desenhaMenu();
 }
 const agenda=()=>{if(!fila){fila=true;requestAnimationFrame(monta)}};

 doc.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-bbg-setor],[data-bbg-item],[data-bbg-fecha],[data-bbg-voltar],[data-bbg-cheia]');if(!t)return;
  if(t.dataset.bbgSetor!=null){const i=+t.dataset.bbgSetor;menu&&menu.setor===i?fechaMenu():menuSetor(i)}
  else if(t.dataset.bbgItem!=null){const it=menu?.itens[+t.dataset.bbgItem];if(it)roda(it.code)}
  else if(t.dataset.bbgFecha)fechaMenu();
  else if(t.dataset.bbgVoltar){if(menu)fechaMenu();else app()?.querySelector('[data-tf415-nav="HOME"]')?.click()}
  else if(t.dataset.bbgCheia){try{localStorage.setItem(CHEIA,cheia()?'0':'1')}catch{}monta()}
 });
 /* linha de comando própria (aparece em Gráficos) */
 doc.addEventListener('submit',e=>{
  const f=e.target;if(!f.matches?.('.bbg-cmdw'))return;e.preventDefault();
  const inp=f.querySelector('input'),v=inp.value.trim();if(!v)return;inp.value='';
  if(!trata(v))roda(v);
 });
 /* número + GO e ativo sozinho também nas linhas de comando que já existiam (Início e Painéis) */
 root.addEventListener('submit',e=>{
  const f=e.target;if(!f.matches?.('.ti539-search')||!noTerminal())return;
  const inp=f.querySelector('input');if(inp&&trata(inp.value)){e.preventDefault();e.stopImmediatePropagation();inp.value='';inp.dispatchEvent(new Event('input',{bubbles:true}))}
 },true);
 root.addEventListener('keydown',e=>{
  if(!noTerminal())return;
  if(e.key==='Escape'&&menu){e.preventDefault();fechaMenu();return}
  if(e.key==='Enter'&&e.target.id==='trcmd'&&trata(e.target.value)){e.preventDefault();e.stopImmediatePropagation();e.target.value='';e.target.dispatchEvent(new Event('input',{bubbles:true}))}
 },true);
 root.addEventListener('click',e=>{
  const go=e.target.closest?.('[data-tr="go"]');if(!go||!noTerminal())return;
  const inp=doc.getElementById('trcmd');if(inp&&trata(inp.value)){e.preventDefault();e.stopImmediatePropagation();inp.value='';inp.dispatchEvent(new Event('input',{bubbles:true}))}
 },true);
 new MutationObserver(agenda).observe(doc.body,{childList:true,subtree:true});
 new MutationObserver(agenda).observe(doc.body,{attributes:true,attributeFilter:['class']});
 if(root.TraderUI?.onRender)root.TraderUI.onRender('terminal-bbg',agenda);
 setInterval(()=>{if(noTerminal()&&!doc.hidden)agenda()},20000);
 root.DiarioTerminalBBG={monta,menuAtivo,menuSetor,fechaMenu,trata,registra};agenda();
})(window,document);
