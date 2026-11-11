/* Aulas em vídeo: roteiros guardados no Supabase (tabela "aulas"), tocados com a voz do aparelho
   (a mesma das aulas de inglês) e visuais desenhados ao vivo: tópicos, diagramas, payoff,
   ajuste diário e gráficos reais pela função "candles". Nada é gravado em vídeo: o app toca a
   narração e troca a tela no ritmo da fala. */
(function(){
'use strict';
if(typeof vEstudos!=='function')return;
const LS_LISTA='aulas-lista-v1',LS_ROT='aulas-rot-v1:',LS_POS='aulas-pos-v1:',LS_VOZ='aulas-voz',LS_VEL='aulas-vel';
const AU={lista:null,busy:0,err:'',ts:0};
const IC={"prev": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 5h2v14H6zM20 5v14L9 12z\"/></svg>", "next": "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M16 5h2v14h-2zM4 5v14l11-7z\"/></svg>", "play": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M7 4v16l13-8z\"/></svg>", "pause": "<svg viewBox=\"0 0 24 24\" width=\"26\" height=\"26\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M6 4h4v16H6zM14 4h4v16h-4z\"/></svg>", "x": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg>", "menu": "<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>"};
const P={on:0,a:null,i:0,j:0,tok:0,play:0,t:0,wd:0,dados:{},vis:'',wl:null};
const h=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lsg=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}};
const lss=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const nf=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const brl=v=>(v<0?'-':'')+'R$ '+nf(Math.abs(v),2);
const pct=v=>(v>0?'+':v<0?'-':'')+nf(Math.abs(v),1)+'%';
const logado=()=>{try{return !!(typeof SESS!=='undefined'&&SESS&&SESS.uid&&cfg())}catch{return false}};

/* ---------- dados ---------- */
async function carregaLista(forca){
  if(AU.busy)return;
  if(!logado()){AU.lista=lsg(LS_LISTA,[]).concat(window.AULAS_LOCAIS||[]);AU.err=AU.lista.length?'':'login';return}
  if(!forca&&AU.lista&&Date.now()-AU.ts<60000)return;
  AU.busy=1;AU.err='';
  try{
    await tok();
    const r=await rq('/rest/v1/aulas?select=id,livro,numero,titulo,capitulos,progresso,criado_em,atualizado_em,erro,status,partes:roteiro->partes,min:roteiro->min&user_id=eq.'+SESS.uid+'&order=livro.asc,numero.asc');
    const l=await r.json();AU.lista=(Array.isArray(l)?l:[]).concat(window.AULAS_LOCAIS||[]);lss(LS_LISTA,l);AU.ts=Date.now();
  }catch(e){AU.lista=lsg(LS_LISTA,[]);AU.err=/aulas|schema cache|404/.test(String(e.message||e))?'tabela':String(e.message||e)}
  AU.busy=0;pinta();
}
async function roteiro(a){
  if(a.roteiro)return a.roteiro;
  const c=lsg(LS_ROT+a.id,null);
  if(c&&c.em===(a.atualizado_em||a.criado_em))return c.r;
  await tok();
  const r=await rq('/rest/v1/aulas?select=roteiro&id=eq.'+a.id),l=await r.json();
  if(!l[0])throw new Error('Aula não encontrada.');
  lss(LS_ROT+a.id,{em:a.atualizado_em||a.criado_em,r:l[0].roteiro});
  return l[0].roteiro;
}
function salvaPos(fim){
  const a=P.a;if(!a)return;
  const pos={cena:P.i,total:a.r.cenas.length,fim:fim?1:((lsg(LS_POS+a.id,{})||{}).fim||0),em:new Date().toISOString()};
  lss(LS_POS+a.id,pos);
  if(!a.local&&logado()){clearTimeout(salvaPos.t);salvaPos.t=setTimeout(()=>{rq('/rest/v1/aulas?id=eq.'+a.id,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({progresso:pos,atualizado_em:pos.em})}).catch(()=>{})},1500)}
}
const posDe=a=>{const l=lsg(LS_POS+a.id,null),s=a.progresso||{};return(l&&(!s.em||l.em>=s.em))?l:s};

/* ---------- lista na aba Estudos ---------- */
function listaHtml(){
  if(AU.lista==null){carregaLista();if(AU.lista==null)return'<div class="card"><div class="sm mut">Carregando aulas…</div></div>'}
  let o='';
  if(AU.err==='login')o+='<div class="card warn"><b>Entre na sua conta</b><div class="sm">Entre na sua conta para carregar suas aulas e continuar o estudo.</div><button type="button" class="btn" data-dt393-route="conta">Entrar na minha conta</button></div>';
  else if(AU.err==='tabela')o+='<div class="card warn"><b>Videoaulas temporariamente indisponíveis</b><div class="sm">A biblioteca de aulas precisa de manutenção. Tente novamente mais tarde.</div></div>';
  else if(AU.err)o+=`<div class="card warn"><b>Não consegui carregar as aulas</b><div class="sm">${h(AU.err)}</div><button class="btn s" data-aurel="1">Tentar de novo</button></div>`;
  const g={};for(const a of AU.lista)(g[a.livro]=g[a.livro]||[]).push(a);
  o+=novaHtml();
  if(!AU.lista.length&&!AU.err&&!G.aberto)o+='<div class="card"><b>Nenhuma aula ainda</b><div class="sm mut">Toque em “Nova aula”, envie o PDF do livro e escolha os capítulos.</div></div>';
  for(const[livro,L]of Object.entries(g)){
    o+=`<div class="card au-livro"><div class="au-lt">${h(livro)}</div>`;
    for(const a of L){
      if(a.status==='gerando'){o+=gerandoHtml(a);continue}
      const p=posDe(a),feito=p.fim,pc=p.total?Math.round(100*Math.min(p.cena,p.total)/p.total):0;
      o+=`<button class="au-item" data-auopen="${h(a.id)}"><span class="au-n">${feito?'✓':a.numero}</span><span class="au-tx"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span class="sm mut">${h(a.capitulos?'Capítulos '+a.capitulos:'')}${a.roteiro_min||a.min?' · ~'+(a.roteiro_min||a.min)+' min':''}${feito?' · concluída':pc?' · parou em '+pc+'%':''}</span>${pc&&!feito?`<span class="au-pb"><i style="width:${pc}%"></i></span>`:''}</span><span class="au-play">▶</span></button>`;
    }
    o+='</div>';
  }
  o+='<details class="sm mut est-audio-help" style="margin:6px 2px 14px"><summary>Ajustes da voz de narração</summary><p>A narração usa a voz do aparelho. No iPhone, baixe uma voz “Aprimorada” ou “Premium” em português (Ajustes → Acessibilidade → Conteúdo Falado → Vozes) para soar mais natural.</p></details>';
  return o;
}
function pinta(){if(typeof tab!=='undefined'&&tab==='estudos'&&ESV==='aul'&&!P.on){const y=scrollY;render();scrollTo(0,y)}}

{const t=vEstudos;vEstudos=function(){
  if(ESV!=='aul')return addBtn(t.apply(this,arguments));
  ESV='liv';let base='';try{base=t.apply(this,arguments)}finally{ESV='aul'}
  base=addBtn(base);
  const m=/<div class="seg"[^>]*>[\s\S]*?<\/div>/.exec(base);
  const topo=m?base.slice(0,m.index+m[0].length).replace(/ class="on"/g,'').replace(/(data-id="aul")/,'class="on" $1'):'<h1>Estudos</h1>';
  return topo+'<div class="au-intro sm mut">Videoaulas narradas dos seus livros, com gráficos reais e exemplos. Cada aula cobre 2 ou 3 capítulos.</div>'+listaHtml();
}}
function addBtn(s){
  if(s.includes('data-id="aul"'))return s;
  return s.replace(/(<div class="seg"[^>]*>[\s\S]*?)(<button[^>]*data-id="ing")/,'$1<button data-ep="esv" data-id="aul">🎬 Aulas</button>$2');
}

/* ---------- voz ---------- */
function vozes(){let v=[];try{v=speechSynthesis.getVoices().filter(x=>/^pt/i.test(x.lang))}catch{}
  const q=x=>(/premium/i.test(x.name)?4:/enhanced|aprimorad|melhorad|neural|natural/i.test(x.name)?3:/siri|google/i.test(x.name)?1:0)+(/BR/i.test(x.lang)?2:0);
  return v.sort((a,b)=>q(b)-q(a)||a.name.localeCompare(b.name))}
function voz(){const v=vozes(),n=lsg(LS_VOZ,'');return v.find(x=>x.name===n)||v[0]||null}
const temVoz=()=>'speechSynthesis'in window;

/* ---------- player ---------- */
const frasesDe=t=>{const s=String(t).replace(/\s+/g,' ').trim().split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9“"(])/);const o=[];
  for(let x of s){while(x.length>230){let k=x.lastIndexOf(', ',220);if(k<80)k=x.lastIndexOf(' ',220);o.push(x.slice(0,k+1).trim());x=x.slice(k+1).trim()}if(x)o.push(x)}return o};
function preenche(txt,d){return String(txt).replace(/\{(\w+)\}/g,(m,k)=>d&&d[k]!=null?d[k]:m)}
function falasCena(c){
  const d=P.dados[P.i]||(c.vis&&c.vis.tipo==='ajuste'&&c.vis.precos?{ph:calcAjuste(c.vis,c.vis.precos).ph}:null);
  const usaSem=c.falaSem&&(!d||d.erro);
  if(c.vis&&c.vis.dados&&!d)return null; // espera os dados
  const L=(usaSem?c.falaSem:c.fala)||[];
  const out=[];L.forEach((p,k)=>frasesDe(preenche(p,d&&d.ph)).forEach(f=>out.push({t:f,k})));
  return out;
}
async function abre(id){
  let a=(AU.lista||[]).find(x=>x.id===id)||(window.AULAS_LOCAIS||[]).find(x=>x.id===id);
  if(!a)return;
  try{toast&&toast('Abrindo a aula…');const r=await roteiro(a);P.a={...a,r};}catch(e){toast&&toast('Não abriu: '+(e.message||e));return}
  P.on=1;P.dados={};const pos=posDe(a);P.i=pos.fim?0:Math.min(pos.cena||0,P.a.r.cenas.length-1);P.j=0;P.play=0;
  document.body.insertAdjacentHTML('beforeend',playerHtml());document.documentElement.classList.add('au-aberto');
  cena(P.i,0);
}
function fecha(){para();salvaPos();P.on=0;P.a=null;const e=document.getElementById('aup');e&&e.remove();document.documentElement.classList.remove('au-aberto');soltaTela();const y=scrollY;render();scrollTo(0,y)}
function playerHtml(){
  const a=P.a,vel=lsg(LS_VEL,1);
  return `<div class="aup" id="aup" role="dialog" aria-label="Aula ${a.numero}">
<div class="aup-top"><button class="aup-x" data-aux="1" aria-label="Fechar">${IC.x}</button><div class="aup-tt"><b>Aula ${a.numero} · ${h(a.titulo)}</b><span id="aupct"></span></div><button class="aup-ix" data-auidx="1" aria-label="Cenas">${IC.menu}</button></div>
<div class="aup-stage"><div class="aup-vis" id="aupvis"></div></div>
<div class="aup-cap" id="aupcap"></div>
<div class="aup-prog" id="aupprog">${a.r.cenas.map((c,k)=>`<i data-aucena="${k}" title="${h(c.titulo||'')}"></i>`).join('')}</div>
<div class="aup-ctl"><button data-auprev="1" aria-label="Cena anterior">${IC.prev}</button><button class="aup-pp" data-aupp="1" aria-label="Tocar">${IC.play}</button><button data-aunext="1" aria-label="Próxima cena">${IC.next}</button>
<select id="aupvel" aria-label="Velocidade">${[0.8,0.9,1,1.1,1.2,1.35].map(v=>`<option value="${v}"${v==vel?' selected':''}>${String(v).replace('.',',')}×</option>`).join('')}</select>
<select id="aupvoz" aria-label="Voz">${temVoz()?vozOpts():'<option>sem voz</option>'}</select></div>
<div class="aup-idx" id="aupidx" hidden>${a.r.cenas.map((c,k)=>`<button data-aucena="${k}"><span>${k+1}</span>${h(c.titulo||'Cena '+(k+1))}</button>`).join('')}${a.local?'':'<button class="aup-del" data-audel="1"><span>✕</span>Apagar esta aula</button>'}</div>
</div>`;
}
function vozOpts(){const v=vozes(),cur=voz();if(!v.length)return'<option value="">voz padrão</option>';return v.map(x=>`<option value="${h(x.name)}"${cur&&cur.name===x.name?' selected':''}>${h(x.name.replace(/\s*\(.*\)/,''))}${/premium|enhanced|aprimorad/i.test(x.name)?' ★':''}</option>`).join('')}
try{speechSynthesis.addEventListener('voiceschanged',()=>{const s=document.getElementById('aupvoz');s&&(s.innerHTML=vozOpts())})}catch{}

function cena(i,j){
  const a=P.a;if(!a)return;
  P.tok++;clearTimeout(P.t);clearTimeout(P.wd);try{speechSynthesis.cancel()}catch{}
  P.i=Math.max(0,Math.min(i,a.r.cenas.length-1));P.j=j||0;
  const c=a.r.cenas[P.i];
  document.getElementById('aupct').textContent=`${P.i+1}/${a.r.cenas.length} · ${c.titulo||''}`;
  document.querySelectorAll('#aupprog i').forEach((e,k)=>{e.className=k<P.i?'ok':k===P.i?'at':''});
  P.vis='';desenha(-1);
  if(c.vis&&c.vis.dados&&!P.dados[P.i])buscaDados(P.i);
  salvaPos();
  if(P.play)P.t=setTimeout(fala,350);else legenda(null);
}
function legenda(f){const e=document.getElementById('aupcap');if(!e)return;
  if(!f){const c=P.a.r.cenas[P.i],L=falasCena(c);e.innerHTML=L&&L[0]?`<span class="mut">${h(L[0].t)}</span>`:'<span class="mut">Carregando dados reais…</span>';return}
  e.innerHTML=h(f.t)}
function fala(){
  if(!P.play||!P.a)return;
  const c=P.a.r.cenas[P.i],L=falasCena(c);
  if(L==null){legenda(null);P.t=setTimeout(fala,400);return}
  if(P.j>=L.length){
    if(P.i>=P.a.r.cenas.length-1){P.play=0;botao();salvaPos(1);soltaTela();legenda({t:'Fim da aula. ✓'});return}
    P.t=setTimeout(()=>{cena(P.i+1,0)},c.pausa!=null?c.pausa:900);return;
  }
  const f=L[P.j];desenha(f.k);legenda(f);
  const tk=++P.tok,vel=+lsg(LS_VEL,1)||1;
  const prox=()=>{if(tk!==P.tok)return;clearTimeout(P.wd);P.j++;P.t=setTimeout(fala,f.t.endsWith('?')?900:180)};
  const est=(f.t.length/14.5/vel)*1000;
  if(!temVoz()||lsg('aulas-mudo',0)){P.wd=setTimeout(prox,Math.max(1800,est*1.05));return}
  try{
    const u=new SpeechSynthesisUtterance(f.t),v=voz();u.lang='pt-BR';v&&(u.voice=v,u.lang=v.lang);u.rate=vel;
    u.onend=prox;u.onerror=e=>{if(e&&/interrupted|canceled/.test(e.error))return;prox()};
    speechSynthesis.speak(u);
    // vigia: alguns aparelhos não avisam o fim da fala
    const vigia=()=>{if(tk!==P.tok)return;let s=0;try{s=speechSynthesis.speaking||speechSynthesis.pending}catch{}if(s){P.wd=setTimeout(vigia,1500);return}prox()};
    P.wd=setTimeout(vigia,est*1.6+2500);
  }catch{P.wd=setTimeout(prox,est)}
}
function tocar(){
  if(!P.a)return;
  if(P.i>=P.a.r.cenas.length-1&&P.j>=((falasCena(P.a.r.cenas[P.i])||[]).length))cena(0,0);
  P.play=1;botao();prendeTela();
  // iOS: a primeira fala precisa nascer do toque
  try{if(temVoz()){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}}catch{}
  clearTimeout(P.t);P.t=setTimeout(fala,120);
}
function para(){P.play=0;P.tok++;clearTimeout(P.t);clearTimeout(P.wd);try{speechSynthesis.cancel()}catch{}botao();soltaTela()}
function botao(){const b=document.querySelector('.aup-pp');b&&(b.innerHTML=P.play?IC.pause:IC.play,b.setAttribute('aria-label',P.play?'Pausar':'Tocar'))}
async function prendeTela(){try{if('wakeLock'in navigator&&!P.wl)P.wl=await navigator.wakeLock.request('screen')}catch{}}
function soltaTela(){try{P.wl&&P.wl.release()}catch{}P.wl=null}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.play)para()});

/* ---------- dados reais (função candles) ---------- */
async function buscaDados(i){
  const c=P.a.r.cenas[i],v=c.vis,d=v.dados;
  const fim=x=>{P.dados[i]=x;if(P.i===i&&P.on){desenha(P.j?((falasCena(c)||[])[P.j]||{}).k:-1);if(!P.play)legenda(null)}};
  if(!logado()&&!window.AULAS_CANDLES){fim({erro:'Entre na conta para carregar o gráfico real.'});return}
  try{
    let j;
    if(window.AULAS_CANDLES)j=window.AULAS_CANDLES(d);
    else{
      await tok();const s=cfg();
      const r=await fetch(s.url+'/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({ativo:d.ativo,de:d.de,ate:d.ate})});
      j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Erro '+r.status);
    }
    let cd=(j.candles||[]).filter(x=>{const t=dia(x[0]);return t>=d.de&&t<=d.ate});
    cd=diario(cd);
    if(cd.length<3)throw new Error('Poucos dados para esse período.');
    const ini=cd[0][4],ult=cd[cd.length-1][4],mx=Math.max(...cd.map(x=>x[2])),mn=Math.min(...cd.map(x=>x[3])),dc=d.casas!=null?d.casas:2;
    const ph={ini:nf(ini,dc),fim:nf(ult,dc),max:nf(mx,dc),min:nf(mn,dc),varp:pct(100*(ult/ini-1)),dias:cd.length,deTx:dataTx(d.de),ateTx:dataTx(d.ate)};
    const out={cd,ph,fonte:j.fonte||'Yahoo Finance',simbolo:j.simbolo||d.ativo};
    if(v.tipo==='ajuste')Object.assign(ph,calcAjuste(v,cd.map(x=>x[4])).ph);
    fim(out);
  }catch(e){fim({erro:String(e.message||e)})}
}
const dia=t=>new Date((t-3*3600)*1000).toISOString().slice(0,10);
const dataTx=s=>{const[y,m,dd]=String(s).split('-');return`${+dd} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][m-1]} de ${y}`};
function diario(cd){const m=new Map();for(const x of cd){const k=dia(x[0]),a=m.get(k);if(!a)m.set(k,[x[0],x[1],x[2],x[3],x[4]]);else{a[2]=Math.max(a[2],x[2]);a[3]=Math.min(a[3],x[3]);a[4]=x[4]}}return[...m.values()]}

/* ---------- visuais ---------- */
function desenha(k){
  const c=P.a.r.cenas[P.i],v=c.vis||{tipo:'titulo',t:c.titulo},el=document.getElementById('aupvis');if(!el)return;
  const chave=P.i+'|'+k+'|'+(P.dados[P.i]?1:0);if(P.vis===chave)return;P.vis=chave;
  const R=VIS[v.tipo]||VIS.titulo;
  el.innerHTML=R(v,k,P.dados[P.i],c);el.className='aup-vis au-'+v.tipo;
}
const mostra=(x,k)=>x==null||x.em==null||k>=x.em;
const VIS={
 titulo(v,k){return`<div class="auv-tit">${v.kicker?`<div class="auv-kick">${h(v.kicker)}</div>`:''}<div class="auv-h">${h(v.t)}</div>${v.sub?`<div class="auv-sub">${h(v.sub)}</div>`:''}${v.chips?`<div class="auv-chips">${v.chips.map(x=>`<span>${h(x)}</span>`).join('')}</div>`:''}</div>`},
 topicos(v,k){return`<div class="auv-top">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<ul>${v.itens.map(x=>{const o=typeof x==='string'?{t:x}:x;return`<li class="${mostra(o,k)?'on':''}">${o.ic?`<span class="ic">${h(o.ic)}</span>`:'<span class="ic dot"></span>'}<span><b>${h(o.t)}</b>${o.s?`<small>${h(o.s)}</small>`:''}</span></li>`}).join('')}</ul></div>`},
 tabela(v,k){return`<div class="auv-tab">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<table><thead><tr>${v.cab.map(x=>`<th>${h(x)}</th>`).join('')}</tr></thead><tbody>${v.linhas.map((l,n)=>{const em=v.em&&v.em[n];return`<tr class="${em==null||k>=em?'on':''}">${l.map((x,m)=>`<td${m===0?' class="r"':''}>${h(x)}</td>`).join('')}</tr>`}).join('')}</tbody></table>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`},
 formula(v,k){return`<div class="auv-for">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<div class="auv-f">${h(v.f)}</div>${(v.linhas||[]).map(x=>{const o=typeof x==='string'?{t:x}:x;return`<div class="auv-fl ${mostra(o,k)?'on':''}${o.forte?' forte':''}">${h(o.t)}</div>`}).join('')}</div>`},
 pergunta(v,k){return`<div class="auv-q"><div class="auv-kick">Revisão</div><div class="auv-qq">${h(v.q)}</div><div class="auv-qa ${k>=(v.em||1)?'on':''}">${h(v.r)}</div></div>`},
 fluxo,payoff,candles,ajuste,convergencia
};
function fluxo(v,k){
  const W=100,H=v.h||56,N={};v.nos.forEach(n=>N[n.id]=n);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg" role="img" aria-label="${h(v.t||'Diagrama')}"><defs><marker id="auar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#94a3b8"/></marker></defs>`;
  for(const a of v.setas||[]){if(!mostra(a,k))continue;const A=N[a.de],B=N[a.para];if(!A||!B)continue;
    const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,wa=(A.w||22)/2,ha=(A.hh||9)/2,wb=(B.w||22)/2,hb=(B.hh||9)/2;
    const ta=Math.min(Math.abs(ux)>1e-6?wa/Math.abs(ux):1e9,Math.abs(uy)>1e-6?ha/Math.abs(uy):1e9)+1,tb=Math.min(Math.abs(ux)>1e-6?wb/Math.abs(ux):1e9,Math.abs(uy)>1e-6?hb/Math.abs(uy):1e9)+1.5;
    const x1=A.x+ux*ta,y1=A.y+uy*ta,x2=B.x-ux*tb,y2=B.y-uy*tb,o=a.off||0,ox=-uy*o,oy=ux*o;
    s+=`<line x1="${x1+ox}" y1="${y1+oy}" x2="${x2+ox}" y2="${y2+oy}" stroke="${a.cor||'#94a3b8'}" stroke-width=".5" marker-end="url(#auar)"${a.dupla?' marker-start="url(#auar)"':''}/>`;
    if(a.t)s+=`<text x="${(x1+x2)/2+ox+(a.tx||0)}" y="${(y1+y2)/2+oy-1.4+(a.ty||0)}" class="auv-st">${h(a.t)}</text>`}
  for(const n of v.nos){if(!mostra(n,k))continue;const w=n.w||22,hh=n.hh||9;
    s+=`<g><rect x="${n.x-w/2}" y="${n.y-hh/2}" width="${w}" height="${hh}" rx="2" fill="${n.cor||'#1e293b'}" stroke="${n.borda||'#334155'}" stroke-width=".4"/><text x="${n.x}" y="${n.y+(n.sub?-.4:1.1)}" class="auv-nt">${h(n.t)}</text>${n.sub?`<text x="${n.x}" y="${n.y+2.9}" class="auv-ns">${h(n.sub)}</text>`:''}</g>`}
  return`<div class="auv-flx">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}</svg>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}
function eixo(x0,x1,n){const r=x1-x0,p=Math.pow(10,Math.floor(Math.log10(r/n))),m=[1,2,2.5,5,10].find(f=>r/(f*p)<=n)*p,o=[];for(let x=Math.ceil(x0/m)*m;x<=x1+1e-9;x+=m)o.push(+x.toFixed(10));return o}
function payoff(v,k){
  const[a,b]=v.x,W=100,H=58,L=11,Rm=3,T=5,B=9;
  const leg=(g,s)=>{const q=g.q||1,pr=g.p||0;let val=g.tipo==='call'?Math.max(s-g.K,0)-pr:g.tipo==='put'?Math.max(g.K-s,0)-pr:s-g.K;return val*(g.pos||1)*q};
  const tot=s=>v.pernas.reduce((t,g)=>t+leg(g,s),0);
  const xs=[];for(let i=0;i<=200;i++)xs.push(a+(b-a)*i/200);
  const all=[0,...xs.map(tot),...(v.pernas.length>1?v.pernas.flatMap(g=>xs.map(s=>leg(g,s))):[])];
  let y0=Math.min(...all),y1=Math.max(...all);const pd=(y1-y0)*.12||1;y0-=pd;y1+=pd;
  const X=s=>L+(s-a)/(b-a)*(W-L-Rm),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B);
  const path=f=>xs.map((s,i)=>(i?'L':'M')+X(s).toFixed(2)+' '+Y(f(s)).toFixed(2)).join('');
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  for(const t of eixo(y0,y1,5))s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(t)}" y2="${Y(t)}" class="auv-grid"/><text x="${L-1}" y="${Y(t)+1}" class="auv-ax" text-anchor="end">${nf(t,Math.abs(t)<10&&t%1?1:0)}</text>`;
  for(const t of eixo(a,b,6))s+=`<text x="${X(t)}" y="${H-B+4}" class="auv-ax" text-anchor="middle">${nf(t,t%1?1:0)}</text>`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(0)}" y2="${Y(0)}" stroke="#64748b" stroke-width=".35"/>`;
  s+=`<path d="${xs.map((x,i)=>(i?'L':'M')+X(x).toFixed(2)+' '+Y(Math.max(0,tot(x))).toFixed(2)).join('')}L${X(b)} ${Y(0)}L${X(a)} ${Y(0)}Z" fill="rgba(34,197,94,.14)"/>`;
  s+=`<path d="${xs.map((x,i)=>(i?'L':'M')+X(x).toFixed(2)+' '+Y(Math.min(0,tot(x))).toFixed(2)).join('')}L${X(b)} ${Y(0)}L${X(a)} ${Y(0)}Z" fill="rgba(239,68,68,.14)"/>`;
  if(v.pernas.length>1)v.pernas.forEach(g=>{s+=`<path d="${path(x=>leg(g,x))}" fill="none" stroke="#64748b" stroke-width=".4" stroke-dasharray="1.2 1"/>`});
  for(const g of v.pernas)if(g.K!=null)s+=`<line x1="${X(g.K)}" x2="${X(g.K)}" y1="${T}" y2="${H-B}" stroke="#475569" stroke-width=".3" stroke-dasharray=".8 .8"/><text x="${X(g.K)}" y="${T+2.6}" class="auv-ax" text-anchor="middle">${h(v.rotK||'K')} ${nf(g.K,g.K%1?2:0)}</text>`;
  s+=`<path d="${path(tot)}" fill="none" stroke="${v.cor||'#38bdf8'}" stroke-width=".9" stroke-linejoin="round"/>`;
  // ponto de equilíbrio
  if(mostra({em:v.emBe},k))for(let i=1;i<xs.length;i++){const p=tot(xs[i-1]),q=tot(xs[i]);if(p===0&&i>1)continue;if((p<0&&q>=0)||(p>0&&q<=0)){const xb=xs[i-1]+(xs[i]-xs[i-1])*(Math.abs(p)/(Math.abs(p)+Math.abs(q)));s+=`<circle cx="${X(xb)}" cy="${Y(0)}" r=".9" fill="#facc15"/><text x="${X(xb)+1}" y="${Y(0)+(v.beBaixo?4:-1.6)}" class="auv-lb" fill="#facc15">equilíbrio ${nf(xb,2)}</text>`}}
  if(v.ponto&&mostra(v.ponto,k)){const P0=v.ponto.s,r=tot(P0);s+=`<circle cx="${X(P0)}" cy="${Y(r)}" r="1.1" fill="#fff"/><text x="${X(P0)+(v.ponto.esq?-1.5:1.5)}" y="${Y(r)-1.8}" class="auv-lb" text-anchor="${v.ponto.esq?'end':'start'}">${h(v.ponto.t||'')} ${r>=0?'+':''}${nf(r,2)}</text>`}
  s+=`<text x="${(L+W-Rm)/2}" y="${H-.6}" class="auv-ax" text-anchor="middle">${h(v.xr||'Preço no vencimento')}</text></svg>`;
  return`<div class="auv-pay">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}
function semDados(v,d){return`<div class="auv-wait">${d&&d.erro?`<b>Gráfico real indisponível agora</b><span>${h(d.erro)}</span>`:'<b>Buscando dados reais…</b><span>'+h(v.dados.ativo)+' · '+h(dataTx(v.dados.de))+' a '+h(dataTx(v.dados.ate))+'</span>'}</div>`}
function candles(v,k,d){
  if(!d||d.erro)return`<div class="auv-cd">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${semDados(v,d)}</div>`;
  const cd=d.cd,W=100,H=56,L=2,Rm=12,T=4,B=6,n=cd.length;
  let y0=Math.min(...cd.map(x=>x[3])),y1=Math.max(...cd.map(x=>x[2]));const pd=(y1-y0)*.06;y0-=pd;y1+=pd;
  const X=i=>L+(i+.5)*(W-L-Rm)/n,Y=y=>T+(y1-y)/(y1-y0)*(H-T-B),bw=Math.max(.15,(W-L-Rm)/n*.62),dc=v.dados.casas!=null?v.dados.casas:2;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  for(const t of eixo(y0,y1,5))s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(t)}" y2="${Y(t)}" class="auv-grid"/><text x="${W-Rm+1}" y="${Y(t)+1}" class="auv-ax">${nf(t,t%1?dc:0)}</text>`;
  cd.forEach((x,i)=>{const up=x[4]>=x[1],c=up?'#22c55e':'#ef4444';s+=`<line x1="${X(i)}" x2="${X(i)}" y1="${Y(x[2])}" y2="${Y(x[3])}" stroke="${c}" stroke-width="${Math.min(.3,bw/2)}"/><rect x="${X(i)-bw/2}" y="${Y(Math.max(x[1],x[4]))}" width="${bw}" height="${Math.max(.15,Math.abs(Y(x[1])-Y(x[4])))}" fill="${c}"/>`});
  const meses=new Set();cd.forEach((x,i)=>{const t=dia(x[0]),m=t.slice(0,7);if(n>60){if(!meses.has(m)){meses.add(m);if(meses.size%2||n<150)s+=`<text x="${X(i)}" y="${H-1.5}" class="auv-ax" text-anchor="middle">${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+t.slice(5,7)-1]}</text>`}}else if(i%Math.ceil(n/7)===0)s+=`<text x="${X(i)}" y="${H-1.5}" class="auv-ax" text-anchor="middle">${t.slice(8,10)}/${t.slice(5,7)}</text>`});
  if(mostra({em:v.emMarcas},k)){
    const a=cd[0][4],b=cd[n-1][4];
    s+=`<line x1="${X(0)}" x2="${X(n-1)}" y1="${Y(a)}" y2="${Y(a)}" stroke="#facc15" stroke-width=".35" stroke-dasharray="1 1"/><circle cx="${X(0)}" cy="${Y(a)}" r=".9" fill="#facc15"/><text x="${X(0)+1}" y="${Y(a)+(b>a?3.6:-1.5)}" class="auv-lb" fill="#facc15">${h(v.rotIni||'início')} ${nf(a,dc)}</text>`;
    s+=`<circle cx="${X(n-1)}" cy="${Y(b)}" r=".9" fill="#38bdf8"/><text x="${X(n-1)-1}" y="${Y(b)+(b>a?-1.5:3.6)}" class="auv-lb" fill="#38bdf8" text-anchor="end">${h(v.rotFim||'fim')} ${nf(b,dc)} (${pct(100*(b/a-1))})</text>`;
  }
  s+='</svg>';
  return`<div class="auv-cd">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${s}<div class="auv-fonte">Dados reais · ${h(d.simbolo)} · ${h(d.fonte)}${v.nota?' · '+h(v.nota):''}</div></div>`;
}
function calcAjuste(v,precos){
  const q=v.contratos||1,m=v.mult,lado=v.lado||1,ini=v.margemIni*q,man=v.margemMan*q,rows=[];let saldo=ini,acum=0,dep=0,ch=0;
  for(let i=0;i<precos.length;i++){
    const p=precos[i],aj=i?(p-precos[i-1])*m*q*lado:0;acum+=aj;saldo+=aj;let call=0;
    if(saldo<man){call=ini-saldo;dep+=call;ch++}
    rows.push({p,aj,acum,saldo,call});if(call)saldo=ini;
  }
  const dcs=v.casas!=null?v.casas:(precos.some(x=>x%1)?1:0);
  return{rows,ini,man,ph:{chamadas:ch===0?'nenhuma chamada de margem':ch===1?'uma chamada de margem':ch+' chamadas de margem',deposito:brl(dep).replace('R$ ','')+' reais',total:(acum<0?'um prejuízo de ':'um lucro de ')+nf(Math.abs(acum),2)+' reais',pIni:nf(precos[0],dcs),pFim:nf(precos[precos.length-1],dcs),margemIni:nf(ini,0)+' reais',margemMan:nf(man,0)+' reais'}};
}
function ajuste(v,k,d){
  let precos=v.precos,datas=null;
  if(v.dados){if(!d||d.erro)return`<div class="auv-aj">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}${semDados(v,d)}</div>`;precos=d.cd.map(x=>+x[4].toFixed(v.dados.casas!=null?v.dados.casas:0));datas=d.cd.map(x=>dia(x[0]))}
  const A=calcAjuste(v,precos),R=A.rows,dc=v.casas!=null?v.casas:(precos.some(x=>x%1)?1:0),mostraTab=mostra({em:v.emTab},k);
  const W=100,H=30,L=2,Rm=16,T=3,B=4,sal=R.map(r=>r.saldo);let y0=Math.min(A.man,...sal),y1=Math.max(A.ini,...sal);const pd=(y1-y0)*.12;y0-=pd;y1+=pd;
  const X=i=>L+i*(W-L-Rm)/Math.max(1,R.length-1),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="auv-svg">`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(A.ini)}" y2="${Y(A.ini)}" stroke="#38bdf8" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${W-Rm+1}" y="${Y(A.ini)+1}" class="auv-ax" fill="#38bdf8">inicial</text>`;
  s+=`<line x1="${L}" x2="${W-Rm}" y1="${Y(A.man)}" y2="${Y(A.man)}" stroke="#f97316" stroke-width=".3" stroke-dasharray="1 .8"/><text x="${W-Rm+1}" y="${Y(A.man)+1}" class="auv-ax" fill="#f97316">manutenção</text>`;
  s+=`<path d="${R.map((r,i)=>(i?'L':'M')+X(i).toFixed(2)+' '+Y(r.saldo).toFixed(2)+(r.call?'L'+X(i).toFixed(2)+' '+Y(A.ini).toFixed(2):'')).join('')}" fill="none" stroke="#e2e8f0" stroke-width=".6"/>`;
  R.forEach((r,i)=>{s+=`<circle cx="${X(i)}" cy="${Y(r.saldo)}" r="${r.call?1.1:.55}" fill="${r.call?'#ef4444':'#e2e8f0'}"/>`});
  s+='</svg>';
  const tabH=`<table class="auv-ajt"><thead><tr><th>${datas?'Dia':'Dia'}</th><th>Preço</th><th>Ajuste</th><th>Saldo</th></tr></thead><tbody>${R.map((r,i)=>`<tr class="${r.call?'call':''}"><td>${datas?datas[i].slice(8,10)+'/'+datas[i].slice(5,7):i+1}</td><td>${nf(r.p,dc)}</td><td class="${r.aj>0?'pos':r.aj<0?'neg':''}">${i?brl(r.aj):'—'}</td><td>${brl(r.saldo)}${r.call?`<small>chamada: +${brl(r.call)}</small>`:''}</td></tr>`).join('')}</tbody></table>`;
  return`<div class="auv-aj">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<div class="auv-ajc">${h(v.desc||'')}</div>${s}${mostraTab?tabH:''}${v.dados&&d?`<div class="auv-fonte">Fechamentos reais · ${h(d.simbolo)} · ${h(d.fonte)}${v.nota?' · '+h(v.nota):''}</div>`:v.nota?`<div class="auv-fonte">${h(v.nota)}</div>`:''}</div>`;
}
function convergencia(v,k){
  const W=100,H=52,L=6,Rm=6,T=6,B=8,X=t=>L+t*(W-L-Rm),Y=y=>T+(1-y)*(H-T-B),n=60;
  const spot=t=>.5+.08*Math.sin(t*9)+.05*Math.sin(t*23+1)-.04*t;
  const caso=(sig,cor,rot,em)=>{if(!mostra({em},k))return'';const fut=t=>spot(t)+sig*.22*(1-t);let p='',q='';for(let i=0;i<=n;i++){const t=i/n;p+=(i?'L':'M')+X(t).toFixed(2)+' '+Y(fut(t)).toFixed(2);}return`<path d="${p}" fill="none" stroke="${cor}" stroke-width=".7"/><text x="${X(.06)}" y="${Y(fut(.06))+(sig>0?-1.6:3.4)}" class="auv-lb" fill="${cor}">${rot}</text>`};
  let sp='';for(let i=0;i<=n;i++){const t=i/n;sp+=(i?'L':'M')+X(t).toFixed(2)+' '+Y(spot(t)).toFixed(2)}
  return`<div class="auv-cv">${v.t?`<div class="auv-h2">${h(v.t)}</div>`:''}<svg viewBox="0 0 ${W} ${H}" class="auv-svg"><line x1="${X(1)}" x2="${X(1)}" y1="${T-2}" y2="${H-B}" stroke="#64748b" stroke-width=".3" stroke-dasharray="1 1"/><text x="${X(1)}" y="${H-B+4}" class="auv-ax" text-anchor="end">vencimento</text><text x="${X(0)}" y="${H-B+4}" class="auv-ax">hoje</text>
${caso(1,'#38bdf8','futuro acima do à vista (normal)',v.emA)}${caso(-1,'#f97316','futuro abaixo do à vista (invertido)',v.emB)}<path d="${sp}" fill="none" stroke="#e2e8f0" stroke-width=".8"/><text x="${X(.62)}" y="${Y(spot(.62))+3.6}" class="auv-lb">preço à vista</text><circle cx="${X(1)}" cy="${Y(spot(1))}" r="1.1" fill="#facc15"/></svg>${v.nota?`<div class="auv-nota">${h(v.nota)}</div>`:''}</div>`;
}

/* ---------- eventos ---------- */
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(b=q('[data-auopen]')){e.preventDefault();abre(b.dataset.auopen);return}
  if(q('[data-aurel]')){AU.lista=null;carregaLista(1);pinta();return}
  if(!P.on)return;
  if(q('[data-aux]')){fecha();return}
  if(q('[data-aupp]')){P.play?para():tocar();return}
  if(q('[data-aunext]')){cena(P.i+1,0);return}
  if(q('[data-auprev]')){cena(P.j>1?P.i:P.i-1,0);return}
  if(q('[data-audel]')){const a=P.a;if(!a||!confirm(`Apagar a aula ${a.numero} de “${a.livro}”? Isso não pode ser desfeito.`))return;rq('/rest/v1/aulas?id=eq.'+a.id,{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(()=>{try{localStorage.removeItem(LS_ROT+a.id);localStorage.removeItem(LS_POS+a.id)}catch{}AU.lista=null;fecha();carregaLista(1);toast&&toast('Aula apagada.')}).catch(e=>toast&&toast('Não apagou: '+(e.message||e)));return}
  if(q('[data-auidx]')){const x=document.getElementById('aupidx');x.hidden=!x.hidden;return}
  if(b=q('[data-aucena]')){document.getElementById('aupidx').hidden=true;cena(+b.dataset.aucena,0);return}
  if(q('.aup-stage')&&!q('select')){P.play?para():tocar()}
},true);
document.addEventListener('change',e=>{
  if(e.target.id==='aupvel'){lss(LS_VEL,+e.target.value);if(P.play){const j=P.j;cena(P.i,j)}}
  if(e.target.id==='aupvoz'){lss(LS_VOZ,e.target.value);if(P.play){cena(P.i,P.j)}}
});
document.addEventListener('keydown',e=>{if(!P.on)return;if(e.key==='Escape')fecha();else if(e.key===' '){e.preventDefault();P.play?para():tocar()}else if(e.key==='ArrowRight')cena(P.i+1,0);else if(e.key==='ArrowLeft')cena(P.i-1,0)});

/* ---------- gerador: PDF do livro → aula pela IA (função "aulas") ---------- */
const LS_JOB='aulas-job-v1';
const G={aberto:0,livros:null,sel:'',novoNome:'',caps:{},manual:'',numero:'',busy:0,msg:'',erro:'',pct:0};
function idb(){return new Promise((ok,no)=>{const r=indexedDB.open(window.DIARIO_DEMO?'aulas-livros-demo':'aulas-livros',1);r.onupgradeneeded=()=>r.result.createObjectStore('livros',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function idbOp(modo,fn){const d=await idb();return new Promise((ok,no)=>{const t=d.transaction('livros',modo),st=t.objectStore('livros'),r=fn(st);t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>no(t.error)})}
async function livrosLista(){try{const L=await idbOp('readonly',st=>st.getAll());G.livros=(L||[]).map(({buf,...x})=>x).sort((a,b)=>b.em.localeCompare(a.em))}catch{G.livros=[]}pinta()}
const livroBuf=id=>idbOp('readonly',st=>st.get(id)).then(x=>x&&x.buf);
async function pdfLib(){
  if(typeof ntLib==='function')return ntLib();
  if(window.pdfjsLib)return window.pdfjsLib;
  const b='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  await new Promise((ok,no)=>{const s=document.createElement('script');s.src=b+'pdf.min.js';s.onload=ok;s.onerror=()=>no(new Error('Sem internet para carregar o leitor de PDF.'));document.head.appendChild(s)});
  window.pdfjsLib.GlobalWorkerOptions.workerSrc=b+'pdf.worker.min.js';return window.pdfjsLib;
}
async function abrePdf(buf){const L=await pdfLib();return L.getDocument({data:new Uint8Array(buf.slice(0))}).promise}
async function sumarioDe(pdf){
  let o=null;try{o=await pdf.getOutline()}catch{}
  if(!o||!o.length)return[];
  let it=o;if(it.length<3)it=it.flatMap(x=>[x,...(x.items||[])]);
  const r=[];
  for(const x of it.slice(0,250)){try{let d=x.dest;if(typeof d==='string')d=await pdf.getDestination(d);if(!Array.isArray(d))continue;const p=typeof d[0]==='number'?d[0]:await pdf.getPageIndex(d[0]);r.push({t:String(x.title||'').replace(/\s+/g,' ').trim().slice(0,110),p:p+1})}catch{}}
  r.sort((a,b)=>a.p-b.p);
  r.forEach((x,i)=>{x.ate=Math.max(x.p,(r[i+1]?r[i+1].p-1:pdf.numPages))});
  return r.filter(x=>x.t);
}
async function enviaPdf(file){
  if(!file)return;if(!/pdf$/i.test(file.type)&&!/\.pdf$/i.test(file.name)){G.erro='Escolha um arquivo PDF.';pinta();return}
  G.busy=1;G.erro='';G.msg='Lendo o PDF…';pinta();
  try{
    const buf=await file.arrayBuffer(),pdf=await abrePdf(buf),sum=await sumarioDe(pdf);
    const nome=(G.novoNome||file.name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ')).trim().slice(0,120);
    const reg={id:'l'+Date.now().toString(36),nome,arquivo:file.name,paginas:pdf.numPages,sumario:sum,tam:file.size,em:new Date().toISOString(),buf};
    await idbOp('readwrite',st=>st.put(reg));
    G.sel=reg.id;G.caps={};G.manual='';G.msg=sum.length?'':'Este PDF não tem sumário embutido: informe as páginas de cada capítulo.';
    await livrosLista();
  }catch(e){G.erro='Não consegui ler o PDF: '+(e.message||e)}
  G.busy=0;pinta();
}
function livroSel(){return(G.livros||[]).find(x=>x.id===G.sel)||null}
function proxNumero(nome){const L=(AU.lista||[]).filter(a=>a.livro===nome);return L.length?Math.max(...L.map(a=>+a.numero||0))+1:1}
function partesEscolhidas(lv){
  if(lv.sumario&&lv.sumario.length&&!G.usarManual)return lv.sumario.filter((x,i)=>G.caps[i]).map(x=>({nome:x.t,de:x.p,ate:x.ate}));
  return G.manual.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const m=/^(.*?)[|:\-–]\s*(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(l)||/^(.*?)\s+(\d+)\s*(?:a|-|–|até)\s*(\d+)\s*$/i.exec(l);return m?{nome:m[1].replace(/[|:\-–]\s*$/,'').trim()||'Capítulo',de:+m[2],ate:+m[3]}:null}).filter(Boolean);
}
function novaHtml(){
  const job=lsg(LS_JOB,null);
  if(!G.aberto)return`<div class="au-novabar"><button class="btn au-nova" data-aunova="1">＋ Nova aula</button>${job&&!G.busy?`<button class="btn s" data-aucont="1">Continuar a aula ${h(job.numero)} de ${h(job.livro)}</button>`:''}</div>`;
  if(G.livros==null){livrosLista();return'<div class="card"><div class="sm mut">Carregando seus livros…</div></div>'}
  const lv=livroSel(),dis=G.busy?' disabled':'';
  let o=`<div class="card au-form"><div class="top"><b>Nova aula</b><button class="btn s" data-aufecha="1"${dis}>Fechar</button></div>`;
  o+=`<label class="sm mut">Livro</label><div class="au-livros">${(G.livros||[]).map(x=>`<button class="au-lv${x.id===G.sel?' on':''}" data-aulv="${h(x.id)}"${dis}><b>${h(x.nome)}</b><span class="sm mut">${x.paginas} págs.${x.sumario&&x.sumario.length?' · sumário com '+x.sumario.length+' itens':''}</span></button>`).join('')}
<label class="au-up${G.busy?' dis':''}"><input type="file" accept="application/pdf,.pdf" id="aupdf"${dis} hidden>📄 Enviar PDF de um livro</label></div>
<div class="sm mut">O PDF fica guardado só neste aparelho. Só o texto dos capítulos escolhidos vai para a IA.</div>`;
  if(lv){
    const num=G.numero||proxNumero(lv.nome),temSum=lv.sumario&&lv.sumario.length&&!G.usarManual;
    o+=`<div class="au-row"><div><label class="sm mut">Nome do livro nas aulas</label><input id="aulvnome" value="${h(lv.nome)}"${dis}></div><div style="max-width:90px"><label class="sm mut">Aula nº</label><input id="aunum" type="number" min="1" value="${h(num)}"${dis}></div></div>`;
    if(temSum){
      const n=Object.values(G.caps).filter(Boolean).length;
      o+=`<label class="sm mut">Capítulos desta aula (marque 2 ou 3 · ${n} marcados)</label><div class="au-caps">${lv.sumario.map((x,i)=>`<label class="au-cap${G.caps[i]?' on':''}"><input type="checkbox" data-aucap="${i}"${G.caps[i]?' checked':''}${dis}><span>${h(x.t)}</span><small>p. ${x.p}–${x.ate}</small></label>`).join('')}</div><button class="lnk sm" data-aumanual="1"${dis}>Prefiro digitar as páginas</button>`;
    }else{
      o+=`<label class="sm mut">Capítulos e páginas do PDF (uma linha por capítulo, até 4)</label><textarea id="aumanual" rows="3" placeholder="Capítulo 3 — Hedge | 56-80&#10;Capítulo 4 — Juros | 81-110"${dis}>${h(G.manual)}</textarea>${lv.sumario&&lv.sumario.length?'<button class="lnk sm" data-aumanual="0">Usar o sumário do PDF</button>':''}`;
    }
    o+=`<div class="au-acoes"><button class="btn" data-augera="1"${dis}>${G.busy?'Gerando…':'🎬 Gerar aula'}</button><button class="lnk sm" data-auapaga="${h(lv.id)}"${dis}>Apagar este PDF do aparelho</button></div>`;
  }
  if(G.msg||G.busy)o+=`<div class="au-prog"><div class="sm">${h(G.msg)}</div>${G.busy?`<div class="au-pb"><i style="width:${G.pct}%"></i></div><div class="sm mut">Leva cerca de 1 minuto a cada 10 páginas. Mantenha o app aberto e a tela ligada.</div>`:''}</div>`;
  if(G.erro)o+=`<div class="card warn" style="margin:10px 0 0"><div class="sm">${h(G.erro)}</div></div>`;
  return o+'</div>';
}
function gerandoHtml(a){
  const job=lsg(LS_JOB,null),meu=job&&job.id===a.id;
  const estado=window.DiarioAulasRecuperacao?.gerandoHtml(a,{busy:!!G.busy,meu:!!meu});if(estado)return estado;
  return`<div class="au-item au-ger"><span class="au-n">…</span><span class="au-tx"><b>Aula ${a.numero} · gerando</b><span class="sm mut">${G.busy&&meu?h(G.msg):meu?'Interrompida. Toque em continuar.':'Em geração em outro aparelho ou interrompida.'}</span></span>${!G.busy&&meu?'<button class="btn s" data-aucont="1">Continuar</button>':''}</div>`;
}
async function chamaFn(corpo,ms){
  await tok();const s=cfg();
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms);
  try{
    const r=await fetch(s.url+'/functions/v1/aulas',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',apikey:s.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(corpo)});
    const j=await r.json().catch(()=>({}));
    if(r.status===404&&!j.error)throw new Error('A função "aulas" não foi encontrada no Supabase.');
    if(!r.ok){const e=new Error(j.error||'Erro '+r.status);e.status=r.status;throw e}
    return j;
  }catch(e){if(e.name==='AbortError'){const x=new Error('A IA demorou demais para responder.');x.status=504;throw x}throw e}
  finally{clearTimeout(t)}
}
async function paginasTexto(pdf,de,ate,on){
  const L=[];de=Math.max(1,de);ate=Math.min(pdf.numPages,ate);
  for(let p=de;p<=ate;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();L.push(tc.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('').replace(/[ \t]+/g,' ').trim());on&&on(p-de+1,ate-de+1)}
  return L;
}
// divide cada capítulo em trechos de ~10 páginas (~28 mil letras): cada trecho é uma chamada curta à IA
function trechos(pags){const B=[];let cur=[],n=0;for(const t of pags){if(n>0&&n+t.length>28000){B.push(cur.join('\n\n'));cur=[];n=0}cur.push(t);n+=t.length}if(cur.length)B.push(cur.join('\n\n'));if(B.length>1&&B[B.length-1].length<7000){const u=B.pop();B[B.length-1]+='\n\n'+u}return B}
async function gerar(cont){
  if(G.busy)return;
  if(!logado()){G.erro='Entre na sua conta (Mais → Conta) para gerar aulas.';pinta();return}
  let job=cont?lsg(LS_JOB,null):null;
  G.erro='';G.msg='';
  if(!job){
    const lv=livroSel();if(!lv){G.erro='Escolha ou envie o PDF do livro.';pinta();return}
    const nome=(document.getElementById('aulvnome')||{}).value||lv.nome,numero=+((document.getElementById('aunum')||{}).value||proxNumero(nome));
    const partes=partesEscolhidas(lv);
    if(!partes.length){G.erro=lv.sumario&&lv.sumario.length&&!G.usarManual?'Marque os capítulos desta aula.':'Escreva os capítulos e páginas, um por linha. Ex.: Capítulo 3 | 56-80';pinta();return}
    if(partes.length>4){G.erro='No máximo 4 capítulos por aula.';pinta();return}
    if(partes.some(p=>p.de<1||p.ate<p.de||p.ate>lv.paginas||p.ate-p.de>120)){G.erro=`Confira as páginas: devem estar entre 1 e ${lv.paginas}, com no máximo 120 por capítulo.`;pinta();return}
    if((AU.lista||[]).some(a=>a.livro===nome.trim()&&+a.numero===numero&&a.status!=='gerando')&&!confirm(`Já existe a aula ${numero} de “${nome}”. Substituir?`))return;
    if(nome.trim()!==lv.nome){try{const x=await idbOp('readonly',st=>st.get(lv.id));x.nome=nome.trim();await idbOp('readwrite',st=>st.put(x));lv.nome=nome.trim()}catch{}}
    job={livroId:lv.id,livro:nome.trim(),numero,partes,feitas:0};
  }
  G.busy=1;G.pct=1;G.msg='Preparando…';pinta();prendeTela();
  try{
    const buf=await livroBuf(job.livroId);
    if(!buf)throw new Error('O PDF deste livro não está mais neste aparelho. Envie o PDF de novo.');
    const pdf=await abrePdf(buf);
    // 1) lê todos os capítulos no aparelho e monta os trechos
    const blocos=[];
    for(const[ci,p]of job.partes.entries()){
      const pags=await paginasTexto(pdf,p.de,p.ate,(k,t)=>{G.msg=`Lendo “${p.nome}” · página ${k} de ${t}`;G.pct=1+8*(ci+k/t)/job.partes.length;pintaProg()});
      const tot=pags.join('').replace(/\s/g,'').length;
      if(tot<600)throw new Error(`Quase não há texto nas páginas ${p.de}–${p.ate}. O PDF pode ser escaneado (imagem), ou as páginas estão erradas.`);
      const tr=trechos(pags);tr.forEach((texto,bi)=>blocos.push({nome:p.nome,texto,bloco:bi,blocos:tr.length}));
    }
    if(blocos.length>24)throw new Error('Capítulos longos demais para uma aula só. Escolha menos capítulos.');
    if(!job.id){const r=await chamaFn({acao:'iniciar',livro:job.livro,numero:job.numero,capitulos:job.partes.map(p=>p.nome)},30000);job.id=r.id;lss(LS_JOB,job);AU.lista=null;carregaLista(1)}
    // 2) a IA escreve um trecho por vez
    const n=blocos.length;
    for(let i=job.feitas;i<n;i++){
      const b=blocos[i],base=10+88*i/n,fatia=88/n;
      G.msg=`A IA está escrevendo “${b.nome}”${b.blocos>1?` (parte ${b.bloco+1} de ${b.blocos})`:''} · ${i+1} de ${n}`;G.pct=base;pintaProg();
      const anda=setInterval(()=>{G.pct=Math.min(base+fatia*.95,G.pct+fatia/90);pintaProg()},1000);
      const corpo={acao:'parte',id:job.id,idx:i,total:n,bloco:b.bloco,blocos:b.blocos,capitulo:b.nome,texto:b.texto};
      try{
        try{await chamaFn(corpo,165000)}
        catch(e){if(e.status===502||e.status===504||e.status===500||e.status===546){G.msg='A IA falhou neste trecho. Tentando de novo…';pintaProg();await chamaFn(corpo,165000)}else throw e}
      }finally{clearInterval(anda)}
      job.feitas=i+1;lss(LS_JOB,job);G.pct=10+88*(i+1)/n;
    }
    try{localStorage.removeItem(LS_JOB)}catch{}
    G.busy=0;G.aberto=0;G.msg='';G.caps={};G.numero='';soltaTela();
    AU.lista=null;await carregaLista(1);toast&&toast('Aula pronta! 🎬');
    const nova=(AU.lista||[]).find(a=>a.id===job.id);pinta();if(nova)setTimeout(()=>abre(nova.id),300);
    return;
  }catch(e){G.erro=(e.message||String(e))+(job.id?' O que já foi feito ficou salvo: toque em “Continuar”.':'');}
  G.busy=0;soltaTela();AU.lista=null;carregaLista(1);pinta();
}
function pintaProg(){const g=document.querySelector('.au-ger .au-tx .sm');g&&(g.textContent=G.msg);const e=document.querySelector('.au-prog');if(e){e.querySelector('.sm').textContent=G.msg;const b=e.querySelector('.au-pb i');b&&(b.style.width=G.pct+'%')}else pinta()}
document.addEventListener('click',e=>{
  const q=s=>e.target.closest(s);let b;
  if(q('[data-aunova]')){G.aberto=1;G.erro='';G.msg='';pinta();return}
  if(q('[data-aufecha]')){G.aberto=0;G.erro='';G.msg='';pinta();return}
  if(b=q('[data-aulv]')){G.sel=b.dataset.aulv;G.caps={};G.numero='';G.usarManual=0;G.erro='';G.msg='';pinta();return}
  if(b=q('[data-aumanual]')){G.usarManual=b.dataset.aumanual==='1';pinta();return}
  if(q('[data-augera]')){gerar(0);return}
  if(q('[data-aucont]')){G.aberto=1;gerar(1);return}
  if(b=q('[data-auapaga]')){if(!confirm('Apagar este PDF do aparelho? As aulas já criadas continuam.'))return;idbOp('readwrite',st=>st.delete(b.dataset.auapaga)).then(()=>{G.sel='';livrosLista()});return}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='aupdf'){G.novoNome='';enviaPdf(t.files&&t.files[0]);return}
  if(t.dataset&&t.dataset.aucap!=null){G.caps[t.dataset.aucap]=t.checked;const y=scrollY;render();scrollTo(0,y);return}
  if(t.id==='aunum')G.numero=t.value;
});
document.addEventListener('input',e=>{if(e.target.id==='aumanual')G.manual=e.target.value});

/* ---------- estilo ---------- */
const css=`
.au-intro{margin:2px 2px 10px}
.au-livro{padding:12px}.au-lt{font-weight:700;font-size:13px;letter-spacing:.02em;text-transform:uppercase;opacity:.7;margin:0 0 8px 2px}
.au-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(127,127,127,.18);padding:12px 2px;color:inherit;font:inherit;cursor:pointer}
.au-item:first-of-type{border-top:0}
.au-n{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:800;background:rgba(16,150,100,.12);color:#0f8a5f}
.au-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.au-pb{display:block;height:4px;border-radius:2px;background:rgba(127,127,127,.2);margin-top:4px;overflow:hidden}.au-pb i{display:block;height:100%;background:#10b981}
.au-play{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#10b981;color:#fff;font-size:13px}
.au-novabar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.au-nova{font-weight:700}
.au-form{display:flex;flex-direction:column;gap:8px}.au-form .top{display:flex;justify-content:space-between;align-items:center}
.au-form input,.au-form textarea{width:100%;box-sizing:border-box}
.au-livros{display:flex;flex-direction:column;gap:6px}
.au-lv{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.25);background:none;color:inherit;font:inherit;cursor:pointer}
.au-lv.on{border-color:#10b981;background:rgba(16,185,129,.08)}
.au-up{display:block;text-align:center;padding:12px;border-radius:12px;border:1.5px dashed rgba(16,150,100,.5);color:#0f8a5f;font-weight:700;cursor:pointer}.au-up.dis{opacity:.5;pointer-events:none}
.au-row{display:flex;gap:8px}.au-row>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.au-caps{max-height:300px;overflow:auto;border:1px solid rgba(127,127,127,.2);border-radius:12px;padding:4px}
.au-cap{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer}.au-cap.on{background:rgba(16,185,129,.1)}
.au-cap span{flex:1;min-width:0;font-size:14px}.au-cap small{flex:none;opacity:.6;font-size:12px}.au-cap input{flex:none;width:18px;height:18px}
.au-acoes{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px}
.au-prog{margin-top:6px;display:flex;flex-direction:column;gap:6px}.au-prog .au-pb{height:6px}.au-pb i{transition:width .8s}
.au-ger{cursor:default}.au-ger .au-n{background:rgba(250,204,21,.15);color:#b45309}
html.au-aberto,html.au-aberto body{overflow:hidden}
.aup{position:fixed;inset:0;z-index:10000;background:#0b1220;color:#e2e8f0;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);font-family:inherit}
.aup button{font:inherit;color:inherit}
.aup-top{display:flex;align-items:center;gap:10px;padding:10px 12px}
.aup-tt{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px;line-height:1.25}.aup-tt b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aup-tt span{font-size:12px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aup-x,.aup-ix{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid #1e293b;background:#111a2e;font-size:16px;cursor:pointer}
.aup-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 14px;cursor:pointer}
.aup-vis{width:100%;max-width:880px;max-height:100%;overflow:auto;animation:auin .35s ease}
@keyframes auin{from{opacity:.25;transform:translateY(6px)}to{opacity:1;transform:none}}
.aup-cap{min-height:4.6em;padding:10px 18px 6px;font-size:17px;line-height:1.45;text-align:center;color:#f8fafc;max-width:880px;margin:0 auto;width:100%;box-sizing:border-box}.aup-cap .mut{color:#64748b}
.aup-prog{display:flex;gap:3px;padding:4px 14px}.aup-prog i{flex:1;height:4px;border-radius:2px;background:#1e293b;cursor:pointer}.aup-prog i.ok{background:#10b981}.aup-prog i.at{background:#38bdf8}
.aup-ctl{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 12px 14px}
.aup-ctl>button{width:46px;height:46px;border-radius:50%;border:1px solid #1e293b;background:#111a2e;font-size:17px;cursor:pointer}
.aup-ctl .aup-pp{width:60px;height:60px;background:#10b981;border-color:#10b981;color:#fff;font-size:22px}
.aup .aup-ctl select{-webkit-appearance:none;appearance:none;background:#111a2e!important;color:#e2e8f0!important;border:1px solid #1e293b!important;border-radius:10px;padding:9px 10px;font:inherit;font-size:13px;max-width:104px;height:auto;min-height:0;box-shadow:none}
.aup .aup-ctl>button,.aup .aup-x,.aup .aup-ix{display:grid;place-items:center;padding:0;color:#e2e8f0;box-shadow:none;min-height:0;min-width:0;flex:none;aspect-ratio:1}
.aup .auv-tab th,.aup .auv-ajt th{color:#7dd3fc!important;opacity:1;text-align:left!important;font-size:12px;text-transform:uppercase;letter-spacing:.04em;background:none}
.aup .auv-tab td,.aup .auv-ajt td{text-align:left!important;color:#e2e8f0;background:none}
.aup .auv-ajt tr.call td{background:rgba(239,68,68,.14)}.aup .auv-ajt td.pos{color:#4ade80}.aup .auv-ajt td.neg{color:#f87171}
.aup .auv-ajt td:nth-child(n+2),.aup .auv-ajt th:nth-child(n+2){text-align:right!important}
.aup-idx{position:absolute;left:0;right:0;bottom:0;top:58px;background:#0b1220f2;overflow:auto;padding:8px 12px calc(16px + env(safe-area-inset-bottom))}
.aup-idx button{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #1e293b;padding:12px 4px;cursor:pointer}.aup-idx span{color:#64748b;min-width:22px}.aup-idx .aup-del{color:#f87171;border-bottom:0;margin-top:10px}.aup-idx .aup-del span{color:#f87171}
.auv-svg{width:100%;height:auto;display:block;font-family:inherit}
.auv-grid{stroke:#1e293b;stroke-width:.25}.auv-ax{font-size:2.3px;fill:#94a3b8}.auv-lb{font-size:2.5px;fill:#e2e8f0;font-weight:600}.auv-st{font-size:2.3px;fill:#cbd5e1;text-anchor:middle}
.auv-nt{font-size:2.9px;fill:#f1f5f9;text-anchor:middle;font-weight:700}.auv-ns{font-size:2.1px;fill:#94a3b8;text-anchor:middle}
.auv-h2{font-size:clamp(17px,4.6vw,26px);font-weight:800;margin:0 0 12px;color:#f8fafc;letter-spacing:-.01em}
.auv-nota,.auv-fonte{font-size:12px;color:#94a3b8;margin-top:8px}
.auv-tit{text-align:center;padding:10px}.auv-kick{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#10b981;font-weight:800;margin-bottom:10px}
.auv-h{font-size:clamp(26px,7.5vw,46px);font-weight:900;line-height:1.08;letter-spacing:-.02em}.auv-sub{font-size:clamp(14px,3.8vw,19px);color:#94a3b8;margin-top:12px;line-height:1.4}
.auv-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:16px}.auv-chips span{border:1px solid #1e3a5f;background:#0f1d33;color:#7dd3fc;border-radius:999px;padding:5px 11px;font-size:13px}
.auv-top ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.auv-top li{display:flex;gap:12px;align-items:flex-start;opacity:.16;transition:opacity .45s,transform .45s;transform:translateX(-4px);font-size:clamp(15px,4vw,20px);line-height:1.35}
.auv-top li.on{opacity:1;transform:none}.auv-top li small{display:block;color:#94a3b8;font-size:.78em;font-weight:400;margin-top:2px}
.auv-top .ic{flex:none;width:30px;height:30px;border-radius:9px;background:#0f1d33;display:grid;place-items:center;font-size:16px}.auv-top .ic.dot:after{content:"";width:8px;height:8px;border-radius:50%;background:#10b981}
.auv-tab table,.auv-ajt{width:100%;border-collapse:collapse;font-size:clamp(12px,3.4vw,16px)}
.auv-tab th,.auv-ajt th{text-align:left;color:#7dd3fc;font-weight:700;padding:7px 6px;border-bottom:1px solid #1e3a5f}
.auv-tab td,.auv-ajt td{padding:7px 6px;border-bottom:1px solid #1e293b;vertical-align:top}.auv-tab td.r{color:#94a3b8;font-weight:600}
.auv-tab tbody tr{opacity:.12;transition:opacity .45s}.auv-tab tbody tr.on{opacity:1}
.auv-ajc{font-size:13px;color:#94a3b8;margin:-6px 0 8px}
.auv-ajt{font-size:12.5px;margin-top:8px;font-variant-numeric:tabular-nums}.auv-ajt td{padding:4px 5px}.auv-ajt .pos{color:#4ade80}.auv-ajt .neg{color:#f87171}.auv-ajt tr.call td{background:rgba(239,68,68,.12)}.auv-ajt small{display:block;color:#fca5a5;font-size:11px}
.auv-for{text-align:center}.auv-f{font-size:clamp(18px,5vw,28px);font-weight:800;background:#0f1d33;border:1px solid #1e3a5f;border-radius:14px;padding:16px 12px;color:#7dd3fc;margin-bottom:14px;font-variant-numeric:tabular-nums}
.auv-fl{font-size:clamp(14px,3.8vw,19px);padding:5px 0;opacity:.14;transition:opacity .45s;font-variant-numeric:tabular-nums}.auv-fl.on{opacity:1}.auv-fl.forte{font-weight:800;color:#facc15}
.auv-q{text-align:center;padding:6px}.auv-qq{font-size:clamp(19px,5.2vw,30px);font-weight:800;line-height:1.25}
.auv-qa{margin-top:20px;font-size:clamp(15px,4.2vw,21px);color:#4ade80;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:14px;opacity:0;transform:translateY(6px);transition:all .5s}.auv-qa.on{opacity:1;transform:none}
.auv-wait{display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;text-align:center;min-height:160px;border:1px dashed #1e3a5f;border-radius:14px;padding:16px;color:#94a3b8}.auv-wait b{color:#e2e8f0}
@media (orientation:landscape) and (max-height:520px){.aup-top{padding:4px 10px}.aup-cap{min-height:2.9em;font-size:15px;padding:4px 14px}.aup-ctl{padding:4px 10px 6px}.aup-ctl>button{width:38px;height:38px}.aup-ctl .aup-pp{width:46px;height:46px}.auv-h2{margin-bottom:6px}}
`;
const st=document.createElement('style');st.id='aulas-css';st.textContent=css;document.head.appendChild(st);
window.AULAS={abre,carregaLista,VIS,calcAjuste,_dbg:{cena,P,falasCena},getStatus:()=>({busy:!!AU.busy,error:AU.err,lastUpdated:AU.ts})};
})();
