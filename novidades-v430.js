/* Diário de Trader v430
 * 1) Dia de turno: ao abrir um trade novo no turno das 8h às 17h (ou no turno das 16h depois das 14h30),
 *    pede confirmação; se confirmar, o trade já vem marcado com a etiqueta "Dia de turno".
 * 2) Revisão da semana: quadro "Semana no padrão Van Tharp" (média por trade em vezes o risco, SQN, disciplina e
 *    perdas além do stop), comparado com o seu histórico, e uma frase do que melhorar.
 * Não remove nenhuma função existente: envolve pBloq e acrescenta o quadro depois do render. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const hoje=()=>g(()=>loc().slice(0,10),new Date().toISOString().slice(0,10));
const agoraMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};

/* ---------- 1) confirmação em dia de turno ---------- */
function turnoRisco(){
  const d=hoje(),cod=g(()=>tcod(d),'');if(!cod)return null;
  const jan=g(()=>janTurno(d),null);if(jan&&jan.nv==='g')return null; // férias / dia livre
  const m=agoraMin();
  if(cod==='8'&&m>=6*60&&m<18*60)return 'Hoje você está no turno das 8h às 17h. O combinado é não operar.';
  if(cod==='16'&&m>=14*60+30&&m<23*60+59)return 'Hoje tem turno das 16h. O combinado é parar às 14h30 para sair a tempo.';
  return null;
}
let ultimoGatilho=null,liberadoAte=0,marcar=false;
doc.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('button,[data-a],a');if(el&&!el.closest('#v430-turno'))ultimoGatilho=el},true);
function abrirAviso(txt){
  let ov=doc.getElementById('v430-turno');
  if(!ov){ov=doc.createElement('div');ov.id='v430-turno';ov.className='v430-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','v430-turno-t');doc.body.appendChild(ov)}
  ov.innerHTML=`<div class="v430-sh"><h2 id="v430-turno-t">Dia de turno</h2><p>${txt}</p><p class="v430-mut">Se for registrar um trade que você já fez, confirme: ele fica com a etiqueta “Dia de turno” para aparecer nas suas estatísticas.</p><div class="v430-acts"><button type="button" class="v430-pri" data-v430t="nao">Não vou operar</button><button type="button" data-v430t="sim">Registrar mesmo assim</button></div></div>`;
  ov.hidden=false;ov.querySelector('[data-v430t="nao"]').focus({preventScroll:true});
}
function fecharAviso(){const ov=doc.getElementById('v430-turno');if(ov)ov.hidden=true}
doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-v430t]');if(!b)return;
  e.preventDefault();e.stopPropagation();fecharAviso();
  if(b.dataset.v430t==='sim'){
    liberadoAte=Date.now()+4000;marcar=true;
    g(()=>{(S.ax??(S.ax={})).turnoViol=((S.ax||{}).turnoViol||[]).concat([{d:hoje(),h:new Date().toTimeString().slice(0,5)}]).slice(-200);save()});
    const el=ultimoGatilho;if(el&&doc.contains(el))setTimeout(()=>el.click(),0);
  }else g(()=>toast('Boa decisão. Hoje o foco é o trabalho.',2500));
},true);
doc.addEventListener('keydown',e=>{if(e.key==='Escape'){const ov=doc.getElementById('v430-turno');if(ov&&!ov.hidden)fecharAviso()}});
function marcarTrade(){
  if(!marcar)return;marcar=false;
  setTimeout(()=>{g(()=>{if(typeof T!=='undefined'&&T&&isNew){const tg=Array.isArray(T.tags)?T.tags:[];if(!tg.includes('Dia de turno'))T.tags=tg.concat(['Dia de turno']);T.turno=1}})},0);
}
function hookBloq(){
  if(typeof root.pBloq!=='function'&&g(()=>typeof pBloq,'')!=='function')return false;
  const atual=g(()=>pBloq,null);if(!atual||atual.__v430)return !!atual;
  const f=function(){
    const ok=atual.apply(this,arguments);if(!ok)return ok;   // trava do app tem prioridade
    if(Date.now()<liberadoAte){liberadoAte=0;marcarTrade();return true}
    const txt=turnoRisco();if(!txt)return true;
    abrirAviso(txt);return false;
  };
  f.__v430=1;
  try{pBloq=f}catch(e){root.pBloq=f}
  return true;
}

/* ---------- 2) Semana no padrão Van Tharp ---------- */
const nf=(v,d=2)=>v==null||!isFinite(v)?'–':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const rTxt=v=>v==null||!isFinite(v)?'–':(v>0?'+':'')+nf(v,2)+'×';
const pcT=v=>v==null||!isFinite(v)?'–':nf(v*100,0)+'%';
function linhas(de,ate){
  return g(()=>S.trades.map(t=>({...t,c:calc(t)})).filter(t=>{if(!t.c||t.c.pl==null)return false;const d=String(t.dtx||t.dt||'').slice(0,10);return (!de||d>=de)&&(!ate||d<=ate)}),[]);
}
function quadro(){
  const r=g(()=>rng(RP),null);if(!r)return '';
  const sem=linhas(r[0],r[1]),tudo=linhas('','');
  const e=g(()=>estat(sem),null),h=g(()=>estat(tudo),null);
  const tit=`<div class="v430-vt-h"><b>Semana no padrão Van Tharp</b><small>Medido em vezes o risco: +2× quer dizer que o trade pagou o dobro do que você arriscou até o stop.</small></div>`;
  if(!e||!e.n)return `<div class="card v430-vt" data-v430vt="1">${tit}<p class="v430-mut">Nenhum trade encerrado neste período.</p></div>`;
  const disc=e.n?sem.filter(t=>t.rules!=='n'&&!(t.err&&t.err!=='Nenhum')).length/e.n:null;
  const alemStop=e.nR?sem.filter(t=>Number.isFinite(t.c.r)&&t.c.r<-1.05).length:0;
  const turno=sem.filter(t=>t.turno||(Array.isArray(t.tags)&&t.tags.includes('Dia de turno'))).length;
  const sqnTxt=e.sqn100==null?'–':nf(e.sqn100,1);
  const qual=g(()=>qualSQN(e.sqn100),'');
  const cel=(lab,val,cls,sub)=>`<div class="v430-vt-c"><small>${lab}</small><b class="${cls||''}">${val}</b>${sub?`<em>${sub}</em>`:''}</div>`;
  const cls=v=>v==null?'':v>0?'v430-pos':v<0?'v430-neg':'';
  // o que melhorar: uma frase, do problema mais grave para o menos grave
  let dica;
  if(e.semStop>0&&e.semStop>=e.n/2)dica=`${e.semStop} de ${e.n} trades sem stop registrado: sem stop não dá para medir o risco. Anote o stop antes de entrar.`;
  else if(alemStop>0)dica=`${alemStop} perda(s) maiores que o stop planejado: o stop não foi respeitado. Na próxima semana, stop no sistema antes da entrada.`;
  else if(disc!=null&&disc<.8)dica=`Você seguiu as regras em ${pcT(disc)} dos trades. A meta é 100%: resultado fora do plano não ensina nada.`;
  else if(turno>0)dica=`${turno} trade(s) em dia de turno. Esses dias são para o trabalho: proteja o descanso e o capital.`;
  else if(e.mediaR!=null&&e.mediaR<0)dica='Expectativa negativa na semana, mesmo dentro das regras. Revise o setup com mais trades antes de aumentar a mão.';
  else if(e.nR<10)dica='Semana dentro das regras. Ainda são poucos trades para julgar o sistema: siga registrando.';
  else dica='Semana dentro das regras e com expectativa positiva. Mantenha o tamanho de posição e repita o processo.';
  const amostra=e.nR<10?`<p class="v430-mut">Amostra pequena (${e.nR} trade${e.nR===1?'':'s'} com stop). O SQN fica confiável a partir de uns 30 trades.</p>`:'';
  return `<div class="card v430-vt" data-v430vt="1">${tit}<div class="v430-vt-g">
    ${cel('Média por trade',rTxt(e.mediaR),cls(e.mediaR),'o risco'+(h&&h.mediaR!=null?' · histórico '+rTxt(h.mediaR):''))}
    ${cel('Soma no período',rTxt(e.mediaR!=null?e.mediaR*e.nR:null),cls(e.mediaR),'o risco · '+e.n+' trade'+(e.n===1?'':'s'))}
    ${cel('SQN',sqnTxt,'',qual?String(qual).toLowerCase():'')}
    ${cel('Acerto',pcT(e.acerto),'',e.payoff!=null?'payoff '+nf(e.payoff,2):'')}
    ${cel('Nas regras',pcT(disc),disc!=null&&disc<.8?'v430-neg':'',turno?turno+' em dia de turno':'')}
    ${cel('Perdas maiores que o stop',String(alemStop),alemStop?'v430-neg':'',e.mediaPerdaR!=null?'perda média '+nf(Math.abs(e.mediaPerdaR),2)+'× o risco':'')}
  </div>${amostra}<p class="v430-dica"><b>Para a próxima semana:</b> ${dica}</p></div>`;
}
function injetaVT(){
  if(g(()=>tab,'')!=='rev')return;
  const app=doc.getElementById('app');if(!app)return;
  const h1=[...app.querySelectorAll('h1')].find(x=>/Revis[aã]o da semana/i.test(x.textContent));if(!h1)return;
  const chave=g(()=>RP,'')+'|'+g(()=>S.trades.length,0)+'|'+g(()=>S.trades.reduce((a,t)=>Math.max(a,t.u||0),0),0);
  const velho=app.querySelector('[data-v430vt]');if(velho&&velho.dataset.k===chave)return;
  const html=quadro();if(!html)return;
  const tmp=doc.createElement('div');tmp.innerHTML=html;const el=tmp.firstElementChild;el.dataset.k=chave;
  if(velho){velho.replaceWith(el);return}
  const cal=[...app.querySelectorAll('h2')].find(x=>/Calend[aá]rio/i.test(x.textContent)&&h1.parentElement.contains(x));
  if(cal)cal.before(el);else h1.parentElement.appendChild(el);
}

/* ---------- ganchos ---------- */
function hookRender(){
  if(typeof root.render0!=='function'||root.render0.__v430)return;
  const prev=root.render0;const f=function(){const o=prev.apply(this,arguments);try{injetaVT()}catch(e){}return o};f.__v430=1;root.render0=f;
}
let k=0;const iv=setInterval(()=>{k++;hookBloq();hookRender();try{injetaVT()}catch(e){}if(k>20)clearInterval(iv)},700);
setInterval(()=>{if(!doc.hidden){hookBloq();try{injetaVT()}catch(e){}}},2500);
root.DIARIO_V430={turnoRisco,quadro};
})(window);
